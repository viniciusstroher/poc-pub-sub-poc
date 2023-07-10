
const grpc = require('@opentelemetry/instrumentation-grpc')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')

const process = require('process')
const { NodeSDK } = require('@opentelemetry/sdk-node')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const { diag, DiagConsoleLogger, DiagLogLevel, metrics, Context } = require('@opentelemetry/api')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http')
const { Resource } = require('@opentelemetry/resources')

const opentelemetry = require("@opentelemetry/api")

const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')

const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { JaegerPropagator } = require('@opentelemetry/propagator-jaeger');


const createTrace = () => {
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

  const { createLogger, format, transports } = require('winston')
  SplunkStreamEvent = require('winston-splunk-httplogger')

  const splunkSettings = {
      token: '00000000-0000-0000-0000-0000000000000',
      url: process.env.SPLUNK || 'http://localhost:8088/services/collector',
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
  const serviceName = process.env.HOST || 'app'

  const metricExporter = new OTLPMetricExporter({
    url: process.env.METRIC || 'http://localhost:4318/v1/metrics',
    // concurrencyLimit: 1,
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.TRACE || 'http://localhost:4318/v1/traces',
  });

  const serviceResource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  })

  const periodicExporter = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 1000
  })

  const sdk = new NodeSDK({
    traceExporter: traceExporter,
    metricReader: periodicExporter,
    instrumentations: [getNodeAutoInstrumentations()],
    // instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()],
    resource: serviceResource, 
    textMapPropagator: new JaegerPropagator() 
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

  const tracer = opentelemetry.trace.getTracer(serviceName);

  const exportTrace = () => {
    
    const output = {};

    // Serialize the traceparent and tracestate from context into
    // an output object.
    //
    // This example uses the active trace context, but you can
    // use whatever context is appropriate to your scenario.
    opentelemetry.propagation.inject(opentelemetry.context.active(), output);

    // const { traceparent, tracestate } = output;

    return output
  }

  const restoreTrace = (spanName, input) => {
    let activeContext = opentelemetry.propagation.extract(opentelemetry.context.active(), input)

    let tracer = opentelemetry.trace.getTracer(serviceName)

    let span = tracer.startSpan(
      spanName,
      {
        kind: 4,
        attributes: {teste: true},
        // root: true
      },
      activeContext
      // opentelemetry.ROOT_CONTEXT
    )

    opentelemetry.trace.setSpan(activeContext, span)

    span.addEvent('message init', {t:true})
    
    span.recordException({message: 'test error'});
    span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
      

    let span2 = tracer.startSpan('app3.mqtt.block1', {}, activeContext)
    span2.addEvent('message init', {t:true})
    span2.end()
    
    span.end()
  }

  return {
    sdk,
    traceExporter,
    metricExporter,
    metrics,
    logger,
    tracer,
    opentelemetry,
    exportTrace,
    restoreTrace
  }
}

module.exports = {
  createTrace
}