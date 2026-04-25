const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Error interno del servidor";

  if (statusCode >= 500) {
    console.error(err);

    if (process.env.SLACK_WEBHOOK) {
      try {
        const { IncomingWebhook } = await import("@slack/webhook");
        const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
        await webhook.send({
          text: `*Error ${statusCode}*\nRuta: ${req.method} ${req.originalUrl}\nMensaje: ${err.message}\nTimestamp: ${new Date().toISOString()}\nStack: ${err.stack}`,
        });
      } catch (slackError) {
        console.error("Error enviando a Slack:", slackError.message);
      }
    }
  }

  res.status(statusCode).json({ error: message });
};

export default errorHandler;
