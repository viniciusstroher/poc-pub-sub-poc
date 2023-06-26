const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PeriodicExportingMetricReader, ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http')

const createTrace = (serviceName) => {
  // configure the SDK to export telemetry data to the console
  // enable all auto-instrumentations from the meta package
  // const traceExporter = new ConsoleSpanExporter();
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  const metricExporter = new OTLPMetricExporter({
    url: process.env.METRIC,
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.TRACE,
  });

  const sdk = new NodeSDK({
    traceExporter: traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter
    }),
    instrumentations: [getNodeAutoInstrumentations()]
  });

  // initialize the SDK and register with the OpenTelemetry API
  // this enables the API to record telemetry
  sdk.start()

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}

module.exports = {
  createTrace
}