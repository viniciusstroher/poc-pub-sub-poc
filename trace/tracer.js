const process = require('process');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { PeriodicExportingMetricReader, ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http')
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const createTrace = (serviceName) => {
  // configure the SDK to export telemetry data to the console
  // enable all auto-instrumentations from the meta package
  // const traceExporter = new ConsoleSpanExporter();
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

  const metricExporter = new OTLPMetricExporter({
    url: process.env.METRIC || 'http://localhost:4318/v1/metrics',
    // concurrencyLimit: 1,
  });

  // const metricExporter = new ConsoleMetricExporter()

  const traceExporter = new OTLPTraceExporter({
    url: process.env.TRACE || 'http://localhost:4318/v1/traces',
  });

  

  const sdk = new NodeSDK({
    traceExporter: traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'api-teste',
    }),  
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