import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import { formulatorAgent } from './agents/formulator-agent.js'
import { agentGateMiddleware, appRoutes, authRoutes } from './routes/app-routes.js'

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mastraDbUrl = `file:${path.join(apiRoot, 'data/mastra.db')}`

export const mastra = new Mastra({
  agents: {
    formulatorAgent,
  },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: mastraDbUrl,
  }),
  server: {
    port: Number(process.env.PORT ?? 4111),
    host: process.env.MASTRA_HOST ?? '0.0.0.0',
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
    middleware: [
      {
        path: '/api/agents/formulatorAgent/*',
        handler: agentGateMiddleware,
      },
    ],
    apiRoutes: [...authRoutes, ...appRoutes],
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
  },
})
