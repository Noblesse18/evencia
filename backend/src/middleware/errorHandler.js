// src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {

  // pour gerer le cas ou il y a un probleme apres aue les hearders sont deja passer 
  if (res.headersSent) {
    return next(err);
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur:', err);
  } else {
    // En production, logger uniquement les infos essentiels
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  // Determiner le code de statut
  const status = err.status || err.statusCode || 500;

  // Ne pas exposer les details des erreurs serveur en production
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Erreur interne du serveur'
    : err.message || 'Une erreur est survenue';
  
  // Reponse
  res.status(status).json({
    message,
    // En developpement, inclure la stack trace
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack }),
  });

}

module.exports = { errorHandler };
