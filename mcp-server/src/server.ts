import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import tools from './tools'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// MCP Tools endpoint
app.get('/tools', (req, res) => {
  const toolList = Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }))
  res.json({ tools: toolList })
})

// Execute tool endpoint
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params
  const tool = (tools as any)[toolName]

  if (!tool) {
    return res.status(404).json({ error: `Tool ${toolName} not found` })
  }

  try {
    const result = await tool.handler(req.body)
    res.json(result)
  } catch (error: any) {
    console.error(`Tool ${toolName} error:`, error)
    res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.toString(),
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`)
  console.log(`Available tools: ${Object.keys(tools).join(', ')}`)
})
