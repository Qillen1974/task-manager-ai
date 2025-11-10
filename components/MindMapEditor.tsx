"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Save, Download, AlertCircle, Loader } from "lucide-react";
import { useApi } from "@/lib/useApi";

interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  color?: string;
  parentId?: string | null;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface MindMapEditorProps {
  mindMapId?: string;
  teamId?: string;
  initialTitle?: string;
  initialDescription?: string;
  onSave?: (mindMapId: string) => void;
  onConvert?: (mindMapId: string) => void;
}

const COLORS = ["blue", "red", "green", "yellow", "purple", "pink", "orange", "teal"];
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const NODE_RADIUS = 40;
const NODE_PADDING = 20;

export default function MindMapEditor({
  mindMapId,
  teamId,
  initialTitle = "New Mind Map",
  initialDescription = "",
  onSave,
  onConvert,
}: MindMapEditorProps) {
  const api = useApi();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([
    {
      id: "root",
      label: "Root",
      color: "blue",
      parentId: null,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    },
  ]);
  const [edges, setEdges] = useState<MindMapEdge[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [selectedNode, setSelectedNode] = useState<string | null>("root");
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionFirstNode, setConnectionFirstNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [isConverted, setIsConverted] = useState(false);

  // Load existing mind map and projects
  useEffect(() => {
    loadProjects();
    if (mindMapId) {
      loadMindMap();
    }
  }, [mindMapId]);

  const loadProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data) {
        setExistingProjects(response.data);
      }
    } catch (err) {
      // Silently fail - projects loading is optional
    }
  };

  const loadMindMap = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/mindmaps/${mindMapId}`);
      if (response.data) {
        const mindMap = response.data;
        setTitle(mindMap.title);
        setDescription(mindMap.description || "");
        setNodes(mindMap.nodes);
        setEdges(mindMap.edges);
        setIsConverted(mindMap.isConverted || false);
      }
    } catch (err) {
      setError("Failed to load mind map");
    } finally {
      setIsLoading(false);
    }
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw edges (connections)
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (source?.x && source?.y && target?.x && target?.y) {
        // Highlight selected edge
        ctx.strokeStyle = selectedEdge === edge.id ? "#ef4444" : "#9ca3af";
        ctx.lineWidth = selectedEdge === edge.id ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const x = node.x || CANVAS_WIDTH / 2;
      const y = node.y || CANVAS_HEIGHT / 2;

      // Determine node color based on selection and connection mode
      let isSelected = false;
      let isPartOfConnection = false;

      if (connectionMode) {
        isPartOfConnection = node.id === connectionFirstNode;
        isSelected = isPartOfConnection;
      } else {
        isSelected = selectedNode === node.id;
      }

      // Circle background
      ctx.fillStyle = isSelected ? "#3b82f6" : getColorHex(node.color || "blue");
      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Border - thicker for selected nodes in connection mode
      ctx.strokeStyle = isSelected ? "#1f2937" : "#ffffff";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Wrap text if too long
      const maxWidth = NODE_RADIUS * 2 - NODE_PADDING;
      const words = node.label.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? currentLine + " " + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);

      const lineHeight = 14;
      const startY = y - (lines.length * lineHeight) / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
      });
    });
  }, [nodes, edges, selectedNode, selectedEdge, connectionMode, connectionFirstNode]);

  const getColorHex = (color: string): string => {
    const colorMap: Record<string, string> = {
      blue: "#3b82f6",
      red: "#ef4444",
      green: "#10b981",
      yellow: "#fbbf24",
      purple: "#a855f7",
      pink: "#ec4899",
      orange: "#f97316",
      teal: "#14b8a6",
    };
    return colorMap[color] || colorMap.blue;
  };

  // Helper function to calculate distance from a point to a line segment
  const distanceToLineSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a node
    const clickedNode = nodes.find((node) => {
      const nodeX = node.x || CANVAS_WIDTH / 2;
      const nodeY = node.y || CANVAS_HEIGHT / 2;
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      return distance <= NODE_RADIUS;
    });

    if (clickedNode) {
      // Handle connection mode
      if (connectionMode) {
        if (connectionFirstNode && clickedNode.id !== connectionFirstNode) {
          // Second node selected - create connection
          const newEdgeId = `edge-${Date.now()}`;
          const newEdge: MindMapEdge = {
            id: newEdgeId,
            source: connectionFirstNode,
            target: clickedNode.id,
          };

          // Avoid duplicate edges
          const exists = edges.some(
            (e) => (e.source === newEdge.source && e.target === newEdge.target) ||
                   (e.source === newEdge.target && e.target === newEdge.source)
          );

          if (!exists) {
            setEdges([...edges, newEdge]);
            setSuccessMessage("Connection created successfully");
            setConnectionMode(false);
            setConnectionFirstNode(null);
            setSelectedNode(null);
          } else {
            setError("Connection already exists between these nodes");
          }
        } else if (connectionFirstNode === clickedNode.id) {
          // Deselect first node
          setConnectionFirstNode(null);
        } else {
          // First node selected
          setConnectionFirstNode(clickedNode.id);
        }
      } else {
        // Normal node selection
        setSelectedNode(clickedNode.id);
        setSelectedEdge(null);
      }
    } else {
      // Check if clicked on an edge
      let clickedEdge = null;
      const EDGE_CLICK_TOLERANCE = 8; // pixels

      for (const edge of edges) {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);

        if (source?.x && source?.y && target?.x && target?.y) {
          const distance = distanceToLineSegment(x, y, source.x, source.y, target.x, target.y);
          if (distance <= EDGE_CLICK_TOLERANCE) {
            clickedEdge = edge.id;
            break;
          }
        }
      }

      if (clickedEdge) {
        setSelectedEdge(clickedEdge);
        setSelectedNode(null);
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
        // Exit connection mode if clicking empty space
        if (connectionMode) {
          setConnectionMode(false);
          setConnectionFirstNode(null);
        }
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find((node) => {
      const nodeX = node.x || CANVAS_WIDTH / 2;
      const nodeY = node.y || CANVAS_HEIGHT / 2;
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      return distance <= NODE_RADIUS;
    });

    if (clickedNode) {
      setIsDragging(true);
      setDraggedNodeId(clickedNode.id);
      setSelectedNode(clickedNode.id);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedNodeId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(NODE_RADIUS, Math.min(CANVAS_WIDTH - NODE_RADIUS, e.clientX - rect.left));
    const y = Math.max(NODE_RADIUS, Math.min(CANVAS_HEIGHT - NODE_RADIUS, e.clientY - rect.top));

    setNodes(nodes.map((n) => (n.id === draggedNodeId ? { ...n, x, y } : n)));
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const addNode = () => {
    if (!selectedNode) {
      setError("Please select a node to add a child node");
      return;
    }

    const newId = `node-${Date.now()}`;
    const parentNode = nodes.find((n) => n.id === selectedNode);

    let x = CANVAS_WIDTH / 2 + Math.random() * 200 - 100;
    let y = CANVAS_HEIGHT / 2 + Math.random() * 200 - 100;

    if (parentNode?.x && parentNode?.y) {
      x = parentNode.x + 120 + Math.random() * 50;
      y = parentNode.y + Math.random() * 100 - 50;
    }

    const newNode: MindMapNode = {
      id: newId,
      label: "New Node",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      parentId: selectedNode,
      x,
      y,
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newId);
  };

  const deleteNode = () => {
    if (!selectedNode || selectedNode === "root") {
      setError("Cannot delete the root node");
      return;
    }

    // Remove node and any edges connected to it
    setNodes(nodes.filter((n) => n.id !== selectedNode));
    setEdges(edges.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
  };

  const updateNodeLabel = (label: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map((n) => (n.id === selectedNode ? { ...n, label } : n)));
  };

  const updateNodeColor = (color: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map((n) => (n.id === selectedNode ? { ...n, color } : n)));
  };

  const toggleConnectionMode = () => {
    if (nodes.length < 2) {
      setError("Need at least 2 nodes to create a connection");
      return;
    }

    if (connectionMode) {
      // Exit connection mode
      setConnectionMode(false);
      setConnectionFirstNode(null);
      setSelectedNode(null);
      setSelectedEdge(null);
    } else {
      // Enter connection mode
      setConnectionMode(true);
      setConnectionFirstNode(null);
      setSelectedEdge(null);
      setError(null);
    }
  };

  const deleteConnection = () => {
    if (!selectedEdge) {
      setError("Please select a connection to delete");
      return;
    }

    setEdges(edges.filter((e) => e.id !== selectedEdge));
    setSelectedEdge(null);
    setSuccessMessage("Connection deleted successfully");
  };

  const saveMindMap = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (mindMapId) {
        // Update existing mind map
        if (teamId) {
          // Team mind map update
          await api.patch(`/teams/${teamId}/mindmaps/${mindMapId}`, {
            title,
            description,
            nodes,
            edges,
          });
        } else {
          // Personal mind map update
          await api.patch(`/mindmaps/${mindMapId}`, {
            title,
            description,
            nodes,
            edges,
          });
        }
      } else {
        // Create new mind map
        let endpoint: string;
        let response: any;

        if (teamId) {
          // Create team mind map
          endpoint = `/teams/${teamId}/mindmaps`;
        } else {
          // Create personal mind map
          endpoint = `/mindmaps`;
        }

        response = await api.post(endpoint, {
          title,
          description,
          nodes,
          edges,
        });

        if (response.data?.id) {
          setSuccessMessage("Mind map saved successfully");
          onSave?.(response.data.id);
        }
      }

      setSuccessMessage("Mind map saved successfully");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to save mind map");
    } finally {
      setIsLoading(false);
    }
  };

  const convertToProjects = async () => {
    if (!mindMapId) {
      setError("Please save the mind map before converting");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const endpoint = teamId
        ? `/teams/${teamId}/mindmaps/${mindMapId}/convert`
        : `/mindmaps/${mindMapId}/convert`;

      await api.post(endpoint);
      setSuccessMessage(
        isConverted
          ? "Mind map re-converted to projects and tasks successfully!"
          : "Mind map converted to projects and tasks successfully!"
      );
      setIsConverted(true);
      setShowConvertConfirm(false);
      onConvert?.(mindMapId);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        "Failed to convert mind map to projects and tasks"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsJson = () => {
    const data = {
      title,
      description,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold mb-2 w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Mind Map Title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-600"
            placeholder="Description (optional)"
            rows={2}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 p-4 bg-gray-100">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleCanvasClick}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="block border border-gray-300 cursor-move"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Nodes: {nodes.length} | Connections: {edges.length}
          </p>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Node Editor</h3>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {isConverted && !showConvertConfirm && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 rounded">
              <p className="text-xs font-semibold text-blue-900 mb-1">✓ Converted to Projects</p>
              <p className="text-xs text-blue-800">
                This mind map has already been converted to projects and tasks. You can make changes and re-convert to create additional projects and tasks.
              </p>
            </div>
          )}

          {/* Selected node editor */}
          {selectedNodeData ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNodeData.label}
                  onChange={(e) => updateNodeLabel(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedNodeData.description || ""}
                  onChange={(e) =>
                    setNodes(
                      nodes.map((n) =>
                        n.id === selectedNode
                          ? { ...n, description: e.target.value }
                          : n
                      )
                    )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateNodeColor(color)}
                      className={`w-full h-8 rounded border-2 ${
                        selectedNodeData.color === color
                          ? "border-gray-800"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: getColorHex(color) }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Root node project selection */}
              {selectedNode === "root" && existingProjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Project (Optional)
                  </label>
                  <select
                    value={selectedNodeData.metadata?.parentProjectId || ""}
                    onChange={(e) =>
                      setNodes(
                        nodes.map((n) =>
                          n.id === selectedNode
                            ? {
                                ...n,
                                metadata: {
                                  ...(n.metadata || {}),
                                  parentProjectId: e.target.value || undefined,
                                },
                              }
                            : n
                        )
                      )
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Create as root project</option>
                    {existingProjects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a project to make this a subproject
                  </p>
                </div>
              )}

              {/* Priority field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (for tasks)
                </label>
                <select
                  value={selectedNodeData.metadata?.priority || ""}
                  onChange={(e) =>
                    setNodes(
                      nodes.map((n) =>
                        n.id === selectedNode
                          ? {
                              ...n,
                              metadata: {
                                ...(n.metadata || {}),
                                priority: e.target.value || undefined,
                              },
                            }
                          : n
                      )
                    )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">No priority</option>
                  <option value="urgent-important">Urgent & Important</option>
                  <option value="not-urgent-important">Important (Not Urgent)</option>
                  <option value="urgent-not-important">Urgent (Not Important)</option>
                  <option value="not-urgent-not-important">Neither</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={selectedNodeData.metadata?.startDate || ""}
                    onChange={(e) =>
                      setNodes(
                        nodes.map((n) =>
                          n.id === selectedNode
                            ? {
                                ...n,
                                metadata: {
                                  ...(n.metadata || {}),
                                  startDate: e.target.value || undefined,
                                },
                              }
                            : n
                        )
                      )
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={selectedNodeData.metadata?.dueDate || ""}
                    onChange={(e) =>
                      setNodes(
                        nodes.map((n) =>
                          n.id === selectedNode
                            ? {
                                ...n,
                                metadata: {
                                  ...(n.metadata || {}),
                                  dueDate: e.target.value || undefined,
                                },
                              }
                            : n
                        )
                      )
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addNode}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Child
                </button>
                <button
                  onClick={deleteNode}
                  disabled={selectedNode === "root"}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              Click on a node to edit it
            </p>
          )}

          {/* Connection mode section */}
          {connectionMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-semibold text-blue-900 mb-2">Connection Mode Active</p>
              {connectionFirstNode ? (
                <p className="text-xs text-blue-800">
                  {nodes.find((n) => n.id === connectionFirstNode)?.label || "Node"} selected
                  <br />
                  <span className="font-medium">Click another node to create connection</span>
                </p>
              ) : (
                <p className="text-xs text-blue-800">Click the first node to start connecting</p>
              )}
            </div>
          )}

          {/* Connection buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={toggleConnectionMode}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium text-white ${
                connectionMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {connectionMode ? "Cancel Connection" : "Add Connection"}
            </button>
            <button
              onClick={deleteConnection}
              disabled={!selectedEdge}
              className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:bg-gray-400"
            >
              Delete Connection
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <button
              onClick={saveMindMap}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mindMapId ? "Update Mind Map" : "Save Mind Map"}
            </button>

            {mindMapId && !showConvertConfirm && (
              <button
                onClick={() => setShowConvertConfirm(true)}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isConverted ? "Re-convert to Projects" : "Convert to Projects"}
              </button>
            )}

            {showConvertConfirm && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  {isConverted
                    ? "This will create new projects and tasks from your updated mind map. Existing projects and tasks will remain unchanged."
                    : "This will create projects and tasks from your mind map."}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={convertToProjects}
                    disabled={isLoading}
                    className="flex-1 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {isLoading ? "Converting..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setShowConvertConfirm(false)}
                    className="flex-1 bg-gray-400 text-white px-2 py-1 rounded text-xs font-medium hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={downloadAsJson}
              className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
