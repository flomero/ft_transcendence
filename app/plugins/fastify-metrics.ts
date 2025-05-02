import fp from "fastify-plugin";
import metricsPlugin, { IMetricsPluginOptions } from "fastify-metrics";

export default fp<IMetricsPluginOptions>(async (fastify) => {
  fastify.register(metricsPlugin, {
    endpoint: "/metrics",
  });
});
