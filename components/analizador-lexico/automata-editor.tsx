'use client';

/**
 * Componente para crear autómatas finitos de forma interactiva usando Cytoscape.js
 * Permite agregar nodos, establecer estados inicial/final y crear transiciones
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Automaton, State, Transition } from '@/lib/types/automata';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  ZoomIn, ZoomOut, Maximize2, Plus, Trash2, 
  Circle, ArrowRight, Link2, MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// Registrar extensiones
if (typeof window !== 'undefined') {
  if (!(cytoscape as any).coseBilkentRegistered) {
    cytoscape.use(coseBilkent);
    (cytoscape as any).coseBilkentRegistered = true;
  }
}

interface AutomataEditorProps {
  onChange: (automaton: Automaton) => void;
  initialAutomaton?: Automaton;
  className?: string;
}

/**
 * Genera estilos de Cytoscape adaptados al tema
 */
function getStylesheet(isDarkMode: boolean): any[] {
  const colors = isDarkMode ? {
    nodeBg: '#1f2937',
    nodeBorder: '#6b7280',
    nodeText: '#f9fafb',
    initialBorder: '#22c55e',
    finalBorder: '#f97316',
    edgeLine: '#60a5fa',
    edgeText: '#f9fafb',
    edgeLabelBg: '#374151',
    selectedBorder: '#3b82f6',
    transitionModeBorder: '#a855f7',
    transitionModeHover: '#c084fc',
  } : {
    nodeBg: '#ffffff',
    nodeBorder: '#9ca3af',
    nodeText: '#111827',
    initialBorder: '#16a34a',
    finalBorder: '#ea580c',
    edgeLine: '#3b82f6',
    edgeText: '#111827',
    edgeLabelBg: '#f3f4f6',
    selectedBorder: '#2563eb',
    transitionModeBorder: '#9333ea',
    transitionModeHover: '#a855f7',
  };

  return [
    {
      selector: 'node',
      style: {
        'background-color': colors.nodeBg,
        'border-width': 2,
        'border-color': colors.nodeBorder,
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': colors.nodeText,
        'font-size': '14px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'width': 50,
        'height': 50,
      },
    },
    {
      selector: 'node.initial',
      style: {
        'border-width': 3,
        'border-color': colors.initialBorder,
      },
    },
    {
      selector: 'node.final',
      style: {
        'border-width': 3,
        'border-color': colors.finalBorder,
        'border-style': 'double',
      },
    },
    {
      selector: 'node.initial.final',
      style: {
        'border-width': 4,
        'border-color': colors.finalBorder,
        'border-style': 'double',
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': colors.selectedBorder,
        'border-width': 4,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': colors.edgeLine,
        'target-arrow-color': colors.edgeLine,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.2,
        'curve-style': 'bezier',
        'label': 'data(label)',
        'text-background-color': colors.edgeLabelBg,
        'text-background-opacity': 1,
        'text-background-padding': '4px',
        'text-background-shape': 'roundrectangle',
        'color': colors.edgeText,
        'font-size': '13px',
        'font-weight': 'bold',
        'font-family': 'ui-monospace, monospace',
        'text-margin-y': -10,
        'text-rotation': 'autorotate',
      },
    },
    {
      selector: 'edge.selfloop',
      style: {
        'curve-style': 'bezier',
        'loop-direction': '-45deg',
        'loop-sweep': '-90deg',
        'control-point-step-size': 60,
        'text-rotation': '0deg',
        'text-margin-y': -15,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': colors.selectedBorder,
        'target-arrow-color': colors.selectedBorder,
        'width': 3,
      },
    },
    // Estilos para modo de creación de transiciones
    {
      selector: 'node.transition-source',
      style: {
        'border-width': 4,
        'border-color': colors.transitionModeBorder,
        'border-style': 'solid',
      },
    },
    {
      selector: 'node.transition-mode-hover',
      style: {
        'border-width': 3,
        'border-color': colors.transitionModeHover,
      },
    },
  ];
}

export function AutomataEditor({
  onChange,
  initialAutomaton,
  className,
}: AutomataEditorProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stateCounter, setStateCounter] = useState(0);
  const [selectedElement, setSelectedElement] = useState<{type: 'node' | 'edge', id: string} | null>(null);
  const [transitionSymbol, setTransitionSymbol] = useState('');
  const [editingTransition, setEditingTransition] = useState<string | null>(null);
  
  // Estado interno del autómata
  const [states, setStates] = useState<State[]>(() => {
    // Inicializar estados con posiciones si no las tienen
    if (initialAutomaton?.states) {
      return initialAutomaton.states.map((state, idx) => ({
        ...state,
        position: state.position || {
          x: 150 + (idx % 4) * 120,
          y: 100 + Math.floor(idx / 4) * 120
        }
      }));
    }
    return [];
  });
  const [transitions, setTransitions] = useState<Transition[]>(initialAutomaton?.transitions || []);
  
  // Ref para evitar llamar onChange al inicializar
  const isInitializedRef = useRef(false);
  const initialAutomatonIdRef = useRef(initialAutomaton?.id);
  
  // Estado para el modo de creación de transiciones
  const [transitionMode, setTransitionMode] = useState(false);
  const [transitionSource, setTransitionSource] = useState<string | null>(null);
  
  // Refs para acceder a valores actuales en los event handlers de Cytoscape
  const transitionModeRef = useRef(transitionMode);
  const transitionSourceRef = useRef(transitionSource);
  
  // Mantener refs sincronizados con el estado
  useEffect(() => {
    transitionModeRef.current = transitionMode;
  }, [transitionMode]);
  
  useEffect(() => {
    transitionSourceRef.current = transitionSource;
  }, [transitionSource]);
  
  // Sincronizar con initialAutomaton cuando cambia (al cambiar de modo)
  useEffect(() => {
    if (initialAutomaton && initialAutomaton.id !== initialAutomatonIdRef.current) {
      initialAutomatonIdRef.current = initialAutomaton.id;
      
      // Actualizar estados con posiciones
      const statesWithPositions = initialAutomaton.states.map((state, idx) => ({
        ...state,
        position: state.position || {
          x: 150 + (idx % 4) * 120,
          y: 100 + Math.floor(idx / 4) * 120
        }
      }));
      setStates(statesWithPositions);
      setTransitions(initialAutomaton.transitions);
      setStateCounter(initialAutomaton.states.length);
      isInitializedRef.current = true; // Marcar como inicializado para no llamar onChange
    }
  }, [initialAutomaton]);
  
  // Estado para el modal de crear transición
  const [pendingTransition, setPendingTransition] = useState<{source: string, target: string} | null>(null);
  const [newTransitionSymbol, setNewTransitionSymbol] = useState('a');

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Convertir estados y transiciones a elementos de Cytoscape
  const elements = useMemo(() => {
    const els: any[] = [];
    
    states.forEach(state => {
      const classes = [];
      if (state.isInitial) classes.push('initial');
      if (state.isFinal) classes.push('final');
      
      els.push({
        data: { 
          id: state.id, 
          label: state.label,
        },
        classes: classes.join(' '),
        position: state.position,
      });
    });
    
    transitions.forEach((trans, idx) => {
      const isSelfLoop = trans.from === trans.to;
      els.push({
        data: {
          id: trans.id,
          source: trans.from,
          target: trans.to,
          label: trans.symbol,
        },
        classes: isSelfLoop ? 'selfloop' : '',
      });
    });
    
    return els;
  }, [states, transitions]);

  // Estilos de Cytoscape
  const stylesheet = useMemo(() => getStylesheet(isDarkMode), [isDarkMode]);

  // Notificar cambios al padre (evitar llamar al inicializar desde initialAutomaton)
  useEffect(() => {
    // Si acabamos de inicializar desde initialAutomaton, no llamar onChange
    if (isInitializedRef.current) {
      isInitializedRef.current = false;
      return;
    }
    
    const alphabet = [...new Set(transitions.map(t => t.symbol))].filter(s => s && s !== 'ε');
    const automaton: Automaton = {
      id: 'editor-' + Date.now(),
      states,
      transitions,
      alphabet,
      type: 'DFA',
    };
    onChange(automaton);
  }, [states, transitions, onChange]);

  // Agregar nuevo estado
  const addState = useCallback(() => {
    const newId = `q${stateCounter}`;
    const newState: State = {
      id: newId,
      label: newId,
      isInitial: states.length === 0, // El primer estado es inicial por defecto
      isFinal: false,
      position: { 
        x: 100 + (stateCounter % 5) * 100, 
        y: 100 + Math.floor(stateCounter / 5) * 100 
      },
    };
    
    setStates(prev => [...prev, newState]);
    setStateCounter(prev => prev + 1);
  }, [stateCounter, states.length]);

  // Eliminar elemento seleccionado
  const deleteSelected = useCallback(() => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'node') {
      setStates(prev => prev.filter(s => s.id !== selectedElement.id));
      setTransitions(prev => prev.filter(t => t.from !== selectedElement.id && t.to !== selectedElement.id));
    } else {
      setTransitions(prev => prev.filter(t => t.id !== selectedElement.id));
    }
    
    setSelectedElement(null);
  }, [selectedElement]);

  // Toggle estado inicial
  const toggleInitial = useCallback(() => {
    if (!selectedElement || selectedElement.type !== 'node') return;
    
    setStates(prev => prev.map(s => ({
      ...s,
      isInitial: s.id === selectedElement.id ? !s.isInitial : false,
    })));
  }, [selectedElement]);

  // Toggle estado final
  const toggleFinal = useCallback(() => {
    if (!selectedElement || selectedElement.type !== 'node') return;
    
    setStates(prev => prev.map(s => 
      s.id === selectedElement.id ? { ...s, isFinal: !s.isFinal } : s
    ));
  }, [selectedElement]);

  // Actualizar símbolo de transición
  const updateTransitionSymbol = useCallback((newSymbol: string) => {
    if (!editingTransition) return;
    
    setTransitions(prev => prev.map(t =>
      t.id === editingTransition ? { ...t, symbol: newSymbol } : t
    ));
  }, [editingTransition]);

  // Toggle modo de creación de transiciones
  const toggleTransitionMode = useCallback(() => {
    setTransitionMode(prev => {
      const newValue = !prev;
      if (!newValue) {
        // Limpiar al desactivar
        setTransitionSource(null);
        cyRef.current?.nodes().removeClass('transition-source');
      }
      return newValue;
    });
    setSelectedElement(null);
    setEditingTransition(null);
  }, []);

  // Cancelar modo transición
  const cancelTransitionMode = useCallback(() => {
    setTransitionMode(false);
    setTransitionSource(null);
    cyRef.current?.nodes().removeClass('transition-source');
  }, []);

  // Manejar clic en nodo durante modo transición
  const handleNodeClickInTransitionMode = useCallback((nodeId: string) => {
    const currentSource = transitionSourceRef.current;
    
    if (!currentSource) {
      // Primer clic: establecer nodo origen
      setTransitionSource(nodeId);
      cyRef.current?.getElementById(nodeId).addClass('transition-source');
    } else {
      // Segundo clic: crear transición
      setPendingTransition({ source: currentSource, target: nodeId });
      setNewTransitionSymbol('a');
      // Limpiar estado del modo transición
      cyRef.current?.getElementById(currentSource).removeClass('transition-source');
      setTransitionSource(null);
      setTransitionMode(false);
      // Deseleccionar todos los nodos en Cytoscape y limpiar estado
      setSelectedElement(null);
      setEditingTransition(null);
      cyRef.current?.nodes().unselect();
    }
  }, []);

  // Configurar Cytoscape (se ejecuta solo una vez al montar)
  const handleCy = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy;
    
    // Eventos de selección - usar refs para acceder al estado actual
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      
      // Si está en modo transición, manejar especialmente
      if (transitionModeRef.current) {
        handleNodeClickInTransitionMode(nodeId);
        return;
      }
      
      setSelectedElement({ type: 'node', id: nodeId });
      setEditingTransition(null);
    });
    
    cy.on('tap', 'edge', (evt) => {
      if (transitionModeRef.current) return; // Ignorar en modo transición
      
      const edgeId = evt.target.id();
      setSelectedElement({ type: 'edge', id: edgeId });
      setEditingTransition(edgeId);
      const label = evt.target.data('label');
      setTransitionSymbol(label || '');
    });
    
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        const currentSource = transitionSourceRef.current;
        if (transitionModeRef.current && currentSource) {
          // Cancelar selección de origen si se hace clic en el fondo
          cyRef.current?.getElementById(currentSource).removeClass('transition-source');
          setTransitionSource(null);
        } else {
          setSelectedElement(null);
          setEditingTransition(null);
        }
      }
    });
    
    // Guardar posiciones al mover nodos
    cy.on('dragfree', 'node', (evt) => {
      const node = evt.target;
      const pos = node.position();
      const nodeId = node.id();
      
      setStates(prev => prev.map(s =>
        s.id === nodeId ? { ...s, position: { x: pos.x, y: pos.y } } : s
      ));
    });
  }, [handleNodeClickInTransitionMode]);

  // Confirmar creación de transición desde el modal
  const confirmTransition = useCallback(() => {
    if (pendingTransition && newTransitionSymbol.trim()) {
      const newTransition: Transition = {
        id: `t-${Date.now()}`,
        from: pendingTransition.source,
        to: pendingTransition.target,
        symbol: newTransitionSymbol.trim(),
      };
      setTransitions(prev => [...prev, newTransition]);
      setPendingTransition(null);
    }
  }, [pendingTransition, newTransitionSymbol]);

  // Actualizar estilos cuando cambia el tema
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.style(stylesheet);
    }
  }, [stylesheet]);

  // Controles de zoom
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  const selectedState = selectedElement?.type === 'node' 
    ? states.find(s => s.id === selectedElement.id) 
    : null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Modal para crear transición */}
      <Dialog open={!!pendingTransition} onOpenChange={(open) => !open && setPendingTransition(null)}>
        <DialogContent className="max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Nueva Transición
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center gap-3 text-sm">
              <Badge variant="outline" className="font-mono">
                {states.find(s => s.id === pendingTransition?.source)?.label || pendingTransition?.source}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="font-mono">
                {states.find(s => s.id === pendingTransition?.target)?.label || pendingTransition?.target}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Símbolo de transición</label>
              <Input
                value={newTransitionSymbol}
                onChange={(e) => setNewTransitionSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmTransition()}
                placeholder="a"
                className="text-center font-mono text-lg"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingTransition(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmTransition} disabled={!newTransitionSymbol.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg">
        <Button size="sm" onClick={addState} className="gap-1.5" disabled={transitionMode}>
          <Plus className="h-4 w-4" />
          Estado
        </Button>
        
        <div className="h-5 w-px bg-border mx-1" />
        
        {/* Botón para activar modo transición */}
        <Button 
          size="sm" 
          variant={transitionMode ? 'default' : 'outline'}
          onClick={toggleTransitionMode}
          className={cn("gap-1.5", transitionMode && "bg-purple-600 hover:bg-purple-700")}
          disabled={states.length < 1}
        >
          <MousePointer2 className="h-4 w-4" />
          {transitionMode ? 'Modo Transición ON' : 'Crear Transición'}
        </Button>
        
        {transitionMode && (
          <div className="flex items-center gap-2 text-sm">
            {!transitionSource ? (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                Selecciona el estado origen
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                Ahora selecciona el destino
              </Badge>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={cancelTransitionMode}
              className="h-7 px-2 text-muted-foreground"
            >
              Cancelar
            </Button>
          </div>
        )}
        
        {!transitionMode && selectedElement && (
          <Button size="sm" variant="destructive" onClick={deleteSelected} className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        )}
        
        {!transitionMode && selectedState && (
          <>
            <div className="h-5 w-px bg-border mx-1" />
            <Button 
              size="sm" 
              variant={selectedState.isInitial ? 'default' : 'outline'}
              onClick={toggleInitial}
              className={cn("gap-1.5", selectedState.isInitial && "bg-green-600 hover:bg-green-700")}
            >
              <ArrowRight className="h-4 w-4" />
              Inicial
            </Button>
            <Button 
              size="sm" 
              variant={selectedState.isFinal ? 'default' : 'outline'}
              onClick={toggleFinal}
              className={cn("gap-1.5", selectedState.isFinal && "bg-orange-600 hover:bg-orange-700")}
            >
              <Circle className="h-4 w-4" />
              Final
            </Button>
          </>
        )}
        
        {!transitionMode && editingTransition && (
          <>
            <div className="h-5 w-px bg-border mx-1" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Símbolo:</span>
              <Input
                value={transitionSymbol}
                onChange={(e) => {
                  setTransitionSymbol(e.target.value);
                  updateTransitionSymbol(e.target.value);
                }}
                className="w-16 h-8 text-center font-mono"
              />
            </div>
          </>
        )}
        
        <div className="flex-1" />
        
        <Button size="sm" variant="ghost" onClick={handleZoomIn} title="Acercar">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleZoomOut} title="Alejar">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleFit} title="Ajustar">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas de Cytoscape */}
      <div className={cn(
        "relative w-full h-80 rounded-lg border bg-muted/20 overflow-hidden",
        transitionMode && "ring-2 ring-purple-500/50"
      )}>
        {states.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Circle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Haz clic en &quot;+ Estado&quot; para agregar un estado</p>
              <p className="text-xs mt-1">Luego usa &quot;Crear Transición&quot; para conectar estados</p>
            </div>
          </div>
        ) : (
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '100%' }}
            stylesheet={stylesheet}
            cy={handleCy}
            layout={{ name: 'preset' }}
            minZoom={0.3}
            maxZoom={3}
            wheelSensitivity={0.2}
            boxSelectionEnabled={false}
          />
        )}
      </div>

      {/* Info del estado actual */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Estados: <Badge variant="secondary">{states.length}</Badge></span>
        <span>Transiciones: <Badge variant="secondary">{transitions.length}</Badge></span>
        {states.filter(s => s.isInitial).length > 0 && (
          <span>Inicial: <Badge variant="outline" className="border-green-500 text-green-600">{states.find(s => s.isInitial)?.label}</Badge></span>
        )}
        {states.filter(s => s.isFinal).length > 0 && (
          <span>Finales: {states.filter(s => s.isFinal).map(s => (
            <Badge key={s.id} variant="outline" className="border-orange-500 text-orange-600 ml-1">{s.label}</Badge>
          ))}</span>
        )}
      </div>
    </div>
  );
}
