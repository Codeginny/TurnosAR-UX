import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="bg-blue-50 dark:bg-slate-900 min-h-screen flex items-center justify-center text-center px-4">
      {/* Ancho mínimo + escala tipográfica: el título nunca se sale de la tarjeta */}
      <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-lg">
        <p className="text-6xl font-extrabold text-blue-600 dark:text-blue-400 leading-none mb-3">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 break-words">Página no encontrada</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Puede que el enlace esté mal escrito o que la página ya no exista.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Ir al Inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

