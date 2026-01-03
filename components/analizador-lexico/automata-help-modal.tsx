'use client';

/**
 * Modal de ayuda para el editor de autómatas
 * Explica cómo usar el modo visual y el modo tabla
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogBody,
} from '@/components/ui/dialog';
import { HelpCircle, MousePointer, Plus, ArrowRight, Circle, Trash2, Move, MousePointer2, Link2 } from 'lucide-react';

interface HelpModalProps {
  mode: 'visual' | 'table';
}

export function AutomataHelpModal({ mode }: HelpModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <HelpCircle className="h-4 w-4" />
        Ayuda
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === 'visual' ? 'Modo Visual - Editor Gráfico' : 'Modo Tabla - Editor de Transiciones'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'visual' 
                ? 'Usa el editor gráfico para crear tu autómata de forma interactiva.'
                : 'Usa la tabla de transiciones para definir tu autómata de forma estructurada.'}
            </DialogDescription>
          </DialogHeader>
          
          <DialogBody>
            <div className="space-y-4">
              {mode === 'visual' ? (
                <>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">1. Agregar Estados</p>
                        <p className="text-xs text-muted-foreground">
                          Haz clic en el botón &quot;+ Estado&quot; para agregar estados al autómata.
                          El primer estado será automáticamente el inicial.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-purple-500/10 p-2 shrink-0">
                        <MousePointer2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">2. Crear Transiciones</p>
                        <p className="text-xs text-muted-foreground">
                          Haz clic en &quot;Crear Transición&quot; para activar el modo de creación.
                          Luego:
                        </p>
                        <ol className="text-xs text-muted-foreground mt-1 ml-4 list-decimal space-y-0.5">
                          <li>Haz clic en el <strong>estado origen</strong> (se resaltará en púrpura)</li>
                          <li>Haz clic en el <strong>estado destino</strong></li>
                          <li>Ingresa el <strong>símbolo</strong> en el modal que aparece</li>
                        </ol>
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 <strong>Para un ciclo:</strong> haz clic dos veces en el mismo estado.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-green-500/10 p-2 shrink-0">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">3. Estado Inicial</p>
                        <p className="text-xs text-muted-foreground">
                          Selecciona un estado y haz clic en &quot;Inicial&quot; para marcarlo.
                          Solo puede haber un estado inicial (borde verde).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-orange-500/10 p-2 shrink-0">
                        <Circle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">4. Estados Finales</p>
                        <p className="text-xs text-muted-foreground">
                          Selecciona un estado y haz clic en &quot;Final&quot; para marcarlo.
                          Puede haber múltiples estados finales (borde naranja doble).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                        <Move className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Mover Estados</p>
                        <p className="text-xs text-muted-foreground">
                          Arrastra los estados desde el centro para reorganizar el grafo visualmente.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-destructive/10 p-2 shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Eliminar Elementos</p>
                        <p className="text-xs text-muted-foreground">
                          Selecciona un estado o transición y usa el botón &quot;Eliminar&quot;.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      <strong>💡 Tip:</strong> Para editar el símbolo de una transición existente, 
                      haz clic sobre ella y usa el campo &quot;Símbolo&quot; en la barra de herramientas.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Agregar Estados</p>
                        <p className="text-xs text-muted-foreground">
                          Haz clic en &quot;Agregar Estado&quot; para añadir una nueva fila.
                          El primer estado agregado será automáticamente inicial.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                        <span className="text-blue-600 font-mono text-xs font-bold">Σ</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Agregar Símbolos al Alfabeto</p>
                        <p className="text-xs text-muted-foreground">
                          Escribe un símbolo en el campo de texto y presiona Enter o el botón +.
                          Cada símbolo agregará una nueva columna de transiciones.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-purple-500/10 p-2 shrink-0">
                        <span className="text-purple-600 font-mono text-xs font-bold">δ</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Definir Transiciones</p>
                        <p className="text-xs text-muted-foreground">
                          Selecciona el estado destino en cada celda usando el menú desplegable.
                          Deja vacío si no hay transición definida.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-green-500/10 p-2 shrink-0">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Estado Inicial</p>
                        <p className="text-xs text-muted-foreground">
                          Usa el botón con flecha para marcar un estado como inicial. Solo puede haber uno.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="rounded-full bg-orange-500/10 p-2 shrink-0">
                        <Circle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Estados Finales</p>
                        <p className="text-xs text-muted-foreground">
                          Usa el botón con círculo para marcar estados de aceptación. Puede haber múltiples.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Formato:</strong> Cada fila es un estado. Cada columna (después de Estado) 
                      es un símbolo del alfabeto. El valor indica el estado destino.
                    </p>
                  </div>
                </>
              )}

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-primary">
                  <strong>Lema de Arden:</strong> El algoritmo convierte el autómata a un sistema de ecuaciones
                  y las resuelve usando el lema: Si X = αX | β, entonces X = α*β
                </p>
              </div>
            </div>
          </DialogBody>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Entendido</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
