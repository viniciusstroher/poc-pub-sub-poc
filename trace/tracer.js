
const grpc = require('@opentelemetry/instrumentation-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { diag, DiagConsoleLogger, DiagLogLevel, metrics } = require('@opentelemetry/api');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http')
const { Resource } = require('@opentelemetry/resources');

const { logs, SeverityNumber } = require('@opentelemetry/api-logs');
const {
  LoggerProvider,
  ConsoleLogRecordExporter,
  SimpleLogRecordProcessor,
} = require('@opentelemetry/sdk-logs');



const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
// 
const createTrace = () => {
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

  const { createLogger, format, transports } = require('winston')
  SplunkStreamEvent = require('winston-splunk-httplogger')

  const splunkSettings = {
      token: '00000000-0000-0000-0000-0000000000000',
      url: 'http://splunk:8088/services/collector',
      index: 'logs'
      // host: 'splunk',
      // port: 8088,
      // path: '/services/collector',
      // protocol: 'http'
  };

  const consoleTransport = new transports.Console();
  const fileTransport = new transports.File({ filename: './log.log' })


  const logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.label({
          label: `SERVER - ${process.env.HOST}`
        }),
        format.json(),
        
    ),
    exitOnError: false,
    transports: [
      consoleTransport,
      fileTransport,
      new SplunkStreamEvent({ splunk: splunkSettings })
    ],
  });

  // console.log(
  //   Logger, transports
  // )
  // // Now use winston as normal
  // const logger = new Logger({
  //     transports: [
  //         new transports.Console(),
  //         new SplunkStreamEvent({ splunk: splunkSettings })
  //     ]
  // });

  // logger.info('This is sent to Splunk');

  const metricExporter = new OTLPMetricExporter({
    url: process.env.METRIC || 'http://localhost:4318/v1/metrics',
    // concurrencyLimit: 1,
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.TRACE || 'http://localhost:4318/v1/traces',
  });

  const serviceResource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.HOST,
  })

  const periodicExporter = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 1000
  })

  const sdk = new NodeSDK({
    traceExporter: traceExporter,
    metricReader: periodicExporter,
    instrumentations: [getNodeAutoInstrumentations()],
    resource: serviceResource,  
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

  return {
    sdk,
    traceExporter,
    metricExporter,
    metrics,
    logger
  }
}

module.exports = {
  createTrace
}