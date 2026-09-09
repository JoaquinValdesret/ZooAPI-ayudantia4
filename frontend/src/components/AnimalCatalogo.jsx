import { useEffect, useState } from 'react';
import { API_URL } from '../api/config';

function AnimalCatalogo() {
  const [animales, setAnimales] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [especieId, setEspecieId] = useState('');
  const [recintoId, setRecintoId] = useState('');
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [autor, setAutor] = useState('');
  const [calificacion, setCalificacion] = useState('5');
  const [comentario, setComentario] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorComentario, setErrorComentario] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/especies`).then((res) => res.json()),
      fetch(`${API_URL}/recintos`).then((res) => res.json()),
    ])
      .then(([especiesData, recintosData]) => {
        setEspecies(especiesData);
        setRecintos(recintosData);
      })
      .catch(() => setError('No se pudieron cargar los filtros'));
  }, []);

  useEffect(() => {
    const parametros = new URLSearchParams();
    if (especieId) parametros.set('especieId', especieId);
    if (recintoId) parametros.set('recintoId', recintoId);

    setCargando(true);
    fetch(`${API_URL}/animals?${parametros.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAnimales(data);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los animales');
        setCargando(false);
      });
  }, [especieId, recintoId]);

  const seleccionarAnimal = (animal) => {
    setAnimalSeleccionado(animal);
    setComentarios([]);
    setErrorComentario(null);

    fetch(`${API_URL}/animals/${animal.id}/comments`)
      .then((res) => res.json())
      .then((data) => setComentarios(data.comentarios || []))
      .catch(() => setErrorComentario('No se pudieron cargar los comentarios'));
  };

  const crearComentario = (event) => {
    event.preventDefault();
    setErrorComentario(null);

    fetch(`${API_URL}/animals/${animalSeleccionado.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autor,
        calificacion: Number(calificacion),
        comentario,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          const mensajes = data.detalles?.map((detalle) => detalle.mensaje).join(' ');
          throw new Error(mensajes || data.error || 'No se pudo crear el comentario');
        }
        return data;
      })
      .then((nuevoComentario) => {
        setComentarios((comentariosActuales) => [nuevoComentario, ...comentariosActuales]);
        setAutor('');
        setCalificacion('5');
        setComentario('');
      })
      .catch((submitError) => setErrorComentario(submitError.message));
  };

  if (cargando) return <p>Cargando animales...</p>;
  if (error) return <p>{error}</p>;

  return (
    <section>
      <h2>Catálogo de animales</h2>

      <label>
        Especie:{' '}
        <select value={especieId} onChange={(event) => setEspecieId(event.target.value)}>
          <option value="">Todas</option>
          {especies.map((especie) => (
            <option key={especie.id} value={especie.id}>{especie.nombre}</option>
          ))}
        </select>
      </label>{' '}
      <label>
        Recinto:{' '}
        <select value={recintoId} onChange={(event) => setRecintoId(event.target.value)}>
          <option value="">Todos</option>
          {recintos.map((recinto) => (
            <option key={recinto.id} value={recinto.id}>{recinto.nombre}</option>
          ))}
        </select>
      </label>

      <ul>
        {animales.map((animal) => (
          <li key={animal.id}>
            <button type="button" onClick={() => seleccionarAnimal(animal)}>
              {animal.nombre}
            </button>{' '}
            {animal.especie?.nombre} - {animal.recinto?.nombre}
          </li>
        ))}
      </ul>

      {animalSeleccionado && (
        <div>
          <h3>Detalle de {animalSeleccionado.nombre}</h3>
          <p>Edad: {animalSeleccionado.edad}</p>
          <p>Peso: {animalSeleccionado.peso ?? 'No registrado'}</p>
          <p>Disponible: {animalSeleccionado.disponible ? 'Sí' : 'No'}</p>

          <h3>Comentarios</h3>
          <ul>
            {comentarios.map((item) => (
              <li key={item.id}>
                <strong>{item.autor}</strong> ({item.calificacion}/5): {item.comentario}
              </li>
            ))}
          </ul>

          <form onSubmit={crearComentario}>
            <h4>Agregar comentario</h4>
            <input
              value={autor}
              onChange={(event) => setAutor(event.target.value)}
              placeholder="Autor"
              required
            />
            <select value={calificacion} onChange={(event) => setCalificacion(event.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <textarea
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              placeholder="Comentario (mínimo 10 caracteres)"
              required
            />
            <button type="submit">Publicar</button>
          </form>

          {errorComentario && <p>{errorComentario}</p>}
        </div>
      )}
    </section>
  );
}

export default AnimalCatalogo;
