import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Content, Player } from '../../api/client'
import DevPanel from './DevPanel'

const fetchMock = vi.hoisted(() => vi.fn<(request: Request) => Promise<Response>>())

vi.mock('../../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/client')>()
  return { ...original, api: original.createApi({ baseUrl: 'http://localhost/api', fetch: (request) => fetchMock(request) }) }
})

const player: Player = {
  id: 'a-hold',
  activeAction: null,
  inventory: {},
  skills: {},
  tools: [],
  storage: { slotCount: 48, stackSize: 10_000, slots: [] },
  updatedAt: '2100-01-01T12:00:00Z',
}

const content: Content = {
  skills: [
    { id: 'woodcutting', category: 'gathering' },
    { id: 'crafting', category: 'production' },
  ],
  actions: [
    { id: 'cut-pine', skillId: 'woodcutting', durationMs: 3000, xpPerCompletion: 10, outputItemId: 'pine-log', outputQuantity: 1, inputs: [] },
    {
      id: 'craft-chipped-stone-axe',
      skillId: 'crafting',
      durationMs: 30000,
      xpPerCompletion: 40,
      outputItemId: 'chipped-stone-axe',
      outputQuantity: 1,
      inputs: [{ itemId: 'pine-log', quantity: 2 }],
    },
  ],
  tools: [{ itemId: 'chipped-stone-axe', family: 'axe', tier: 1, skillId: 'woodcutting' }],
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  render(<DevPanel player={player} content={content} />, { wrapper })
}

async function lastRequest() {
  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  const request = fetchMock.mock.lastCall![0]
  return { method: request.method, path: new URL(request.url).pathname, body: await request.clone().text() }
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(Response.json(player))
})

describe('DevPanel', () => {
  it('stays closed until the GM button is pressed', async () => {
    renderPanel()
    expect(screen.queryByRole('region', { name: 'Development tools' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'GM' }))

    expect(screen.getByRole('region', { name: 'Development tools' })).toBeInTheDocument()
  })

  it('sets the chosen trade to the chosen level', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: 'GM' }))

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Trade' }), 'crafting')
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Level' }), '25')
    await userEvent.click(screen.getAllByRole('button', { name: 'Set' })[0]!)

    expect(await lastRequest()).toEqual({ method: 'PUT', path: '/api/dev/player/skills/crafting', body: '{"level":25}' })
  })

  it('gives a tool by setting its count to one', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: 'GM' }))

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Item' }), 'chipped-stone-axe')
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Count' }), '1')
    await userEvent.click(screen.getAllByRole('button', { name: 'Set' })[1]!)

    expect(await lastRequest()).toEqual({ method: 'PUT', path: '/api/dev/player/items/chipped-stone-axe', body: '{"count":1}' })
  })

  it('skips eight hours', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: 'GM' }))

    await userEvent.click(screen.getByRole('button', { name: '+8 h' }))

    expect(await lastRequest()).toEqual({ method: 'POST', path: '/api/dev/player/advance', body: '{"minutes":480}' })
  })

  it('resets the hold only after confirming', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: 'GM' }))

    await userEvent.click(screen.getByRole('button', { name: 'Reset the hold' }))
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Reset the hold' }))
    expect(await lastRequest()).toMatchObject({ method: 'POST', path: '/api/dev/player/reset' })
    confirm.mockRestore()
  })
})
