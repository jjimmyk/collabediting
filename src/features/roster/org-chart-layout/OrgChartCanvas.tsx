import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'
import {
  buildOrgChartFlowElements,
  collectOrgChartCanvasNodes,
} from '@/features/roster/org-chart-layout/build-org-chart-graph'
import { mergeOrgChartLayout } from '@/features/roster/org-chart-layout/merge-org-chart-layout'
import { OrgChartFlowNode } from '@/features/roster/org-chart-layout/OrgChartFlowNode'
import type {
  OrgChartNodePosition,
  OrgChartPersistedLayout,
  OrgChartViewport,
} from '@/features/roster/org-chart-layout/types'
import { cn } from '@/lib/utils'

const nodeTypes = {
  orgChart: OrgChartFlowNode,
}

type OrgChartCanvasProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  visiblePositions: Set<string>
  savedLayout: OrgChartPersistedLayout | null
  editMode: boolean
  readOnly?: boolean
  className?: string
  onDraftChange?: (layout: OrgChartPersistedLayout) => void
  onViewportChange?: (viewport: OrgChartViewport) => void
  fitViewSignal?: number
}

function OrgChartCanvasInner({
  orgChartLayout,
  visiblePositions,
  savedLayout,
  editMode,
  readOnly = false,
  className,
  onDraftChange,
  onViewportChange,
  fitViewSignal = 0,
}: OrgChartCanvasProps) {
  const { fitView, getViewport, setViewport } = useReactFlow()
  const nodeDefs = useMemo(
    () => collectOrgChartCanvasNodes(orgChartLayout, visiblePositions),
    [orgChartLayout, visiblePositions]
  )

  const { nodePositions, viewport: initialViewport } = useMemo(
    () => mergeOrgChartLayout(nodeDefs, savedLayout),
    [nodeDefs, savedLayout]
  )

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildOrgChartFlowElements(nodeDefs, nodePositions),
    [nodeDefs, nodePositions]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const skipNextDraftRef = useRef(true)

  useEffect(() => {
    skipNextDraftRef.current = true
    setNodes(initialNodes.map((node) => ({ ...node, draggable: editMode && !readOnly })))
    setEdges(initialEdges)
    setViewport(initialViewport)
  }, [initialNodes, initialEdges, initialViewport, editMode, readOnly, setNodes, setEdges, setViewport])

  useEffect(() => {
    if (fitViewSignal <= 0) return
    void fitView({ padding: 0.2, duration: 250 })
  }, [fitViewSignal, fitView])

  const emitDraft = useCallback(
    (nextNodes: Node[]) => {
      if (!onDraftChange) return
      const positions: Record<string, OrgChartNodePosition> = {}
      for (const node of nextNodes) {
        positions[node.id] = { x: node.position.x, y: node.position.y }
      }
      const currentViewport = getViewport()
      onDraftChange({
        version: 1,
        nodes: positions,
        viewport: {
          x: currentViewport.x,
          y: currentViewport.y,
          zoom: currentViewport.zoom,
        },
      })
    },
    [getViewport, onDraftChange]
  )

  useEffect(() => {
    if (skipNextDraftRef.current) {
      skipNextDraftRef.current = false
      return
    }
    if (!editMode || readOnly) return
    emitDraft(nodes)
  }, [nodes, editMode, readOnly, emitDraft])

  const handleMoveEnd = useCallback(
    (_event: unknown, nextViewport: Viewport) => {
      onViewportChange?.({
        x: nextViewport.x,
        y: nextViewport.y,
        zoom: nextViewport.zoom,
      })
      if (editMode && !readOnly) {
        emitDraft(nodes)
      }
    },
    [editMode, emitDraft, nodes, onViewportChange, readOnly]
  )

  if (nodeDefs.length === 0) {
    return (
      <div className={cn('flex h-48 items-center justify-center rounded-md border text-sm text-muted-foreground', className)}>
        No org chart nodes to display.
      </div>
    )
  }

  return (
    <div className={cn('h-[min(72vh,720px)] min-h-[420px] w-full rounded-md border bg-background/40', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMoveEnd={handleMoveEnd}
        nodesDraggable={editMode && !readOnly}
        nodesConnectable={false}
        elementsSelectable={editMode && !readOnly}
        panOnDrag={!editMode || readOnly ? true : [1, 2]}
        zoomOnScroll
        snapToGrid={editMode && !readOnly}
        snapGrid={[20, 20]}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        fitView={fitViewSignal === 0}
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          className="!bg-background/80"
        />
      </ReactFlow>
    </div>
  )
}

export function OrgChartCanvas(props: OrgChartCanvasProps) {
  return (
    <ReactFlowProvider>
      <OrgChartCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
