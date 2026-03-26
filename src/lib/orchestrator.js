/**
 * Orquestrador — coordena agentes automaticamente
 * Recebe objetivo em linguagem natural
 * Divide em tarefas, executa, registra resultado
 */

import { callClaude } from './api.js';
import { validateCode } from '../config/validator.js';

// Status possiveis de uma tarefa
const STATUS = {
  PENDENTE: 'pendente',
  EXECUTANDO: 'executando',
  CONCLUIDO: 'concluido',
  FALHOU: 'falhou',
};

// Agentes disponiveis na Fase 1
const AGENTES = {
  EXECUTOR: 'executor',
  CRITICO: 'critico',
  REVIEWER: 'reviewer',
};

// Prompt para planejar tarefas
const PLANNER_PROMPT = `Voce e um orquestrador de agentes de desenvolvimento.
Receba um objetivo e divida em tarefas concretas e executaveis.

Agentes disponiveis:
- executor: gera codigo React+TypeScript
- critico: valida codigo e retorna score 0-100
- reviewer: corrige problemas no codigo

Retorne APENAS JSON valido neste formato:
{
  "objetivo": "string",
  "tarefas": [
    {
      "id": 1,
      "agente": "executor|critico|reviewer",
      "instrucao": "instrucao clara e especifica",
      "dependeDe": null ou [ids das tarefas anteriores]
    }
  ]
}

Maximo 5 tarefas. Seja especifico e direto.`;

class Orchestrator {
  constructor(onProgress) {
    this.tarefas = [];
    this.resultados = {};
    this.onProgress = onProgress || (() => {});
    this.rodando = false;
  }

  // Planeja tarefas a partir do objetivo
  async planejar(objetivo) {
    this.onProgress({ stage: 'planejando', message: 'Analisando objetivo...' });

    try {
      const resposta = await callClaude(
        PLANNER_PROMPT,
        `Objetivo: ${objetivo}`,
        1000
      );

      const clean = resposta.replace(/```json|```/g, '').trim();
      const plano = JSON.parse(clean);
      this.tarefas = plano.tarefas;

      this.onProgress({
        stage: 'planejado',
        message: `${this.tarefas.length} tarefas planejadas`,
        tarefas: this.tarefas,
      });

      return this.tarefas;
    } catch (err) {
      throw new Error(`Erro ao planejar: ${err.message}`);
    }
  }

  // Executa uma tarefa no agente correto
  async executarTarefa(tarefa, contexto = '') {
    this.onProgress({
      stage: 'executando',
      message: `Tarefa ${tarefa.id}/${this.tarefas.length} — ${tarefa.agente}`,
      tarefaId: tarefa.id,
    });

    tarefa.status = STATUS.EXECUTANDO;

    try {
      let resultado;

      switch (tarefa.agente) {
        case AGENTES.EXECUTOR:
          resultado = await this.executarComExecutor(tarefa, contexto);
          break;
        case AGENTES.CRITICO:
          resultado = await this.executarComCritico(tarefa, contexto);
          break;
        case AGENTES.REVIEWER:
          resultado = await this.executarComReviewer(tarefa, contexto);
          break;
        default:
          throw new Error(`Agente desconhecido: ${tarefa.agente}`);
      }

      tarefa.status = STATUS.CONCLUIDO;
      this.resultados[tarefa.id] = resultado;

      this.onProgress({
        stage: 'tarefa_concluida',
        message: `Tarefa ${tarefa.id} concluida`,
        tarefaId: tarefa.id,
        resultado,
      });

      return resultado;
    } catch (err) {
      tarefa.status = STATUS.FALHOU;
      this.onProgress({
        stage: 'tarefa_falhou',
        message: `Tarefa ${tarefa.id} falhou: ${err.message}`,
        tarefaId: tarefa.id,
      });
      return { ok: false, erro: err.message };
    }
  }

  // Executor gera codigo
  async executarComExecutor(tarefa, contexto) {
    const { callClaudeStream } = await import('./api.js');
    let codigo = '';

    await callClaudeStream(
      null,
      tarefa.instrucao + (contexto ? `\n\nContexto: ${contexto}` : ''),
      8000,
      (chunk) => { codigo += chunk; }
    );

    return { ok: true, codigo, agente: 'executor' };
  }

  // Critico valida codigo
  async executarComCritico(tarefa, contexto) {
    const codigoParaValidar = contexto || tarefa.instrucao;
    const validacao = validateCode(codigoParaValidar);

    return {
      ok: validacao.score >= 70,
      score: validacao.score,
      details: validacao.details,
      agente: 'critico',
    };
  }

  // Reviewer corrige codigo
  async executarComReviewer(tarefa, contexto) {
    const codigoCorrigido = await callClaude(
      null,
      `Corrija este codigo:\n${contexto}`,
      8000
    );

    return { ok: true, codigo: codigoCorrigido, agente: 'reviewer' };
  }

  // Loop principal — executa todas as tarefas em ordem
  async run(objetivo) {
    this.rodando = true;
    this.tarefas = [];
    this.resultados = {};

    try {
      // Fase 1: Planejar
      await this.planejar(objetivo);

      // Fase 2: Executar em ordem respeitando dependencias
      for (const tarefa of this.tarefas) {
        if (!this.rodando) break;

        // Verificar dependencias
        if (tarefa.dependeDe) {
          const dependenciasOk = tarefa.dependeDe.every(
            (id) => this.resultados[id]?.ok
          );
          if (!dependenciasOk) {
            tarefa.status = STATUS.FALHOU;
            continue;
          }
        }

        // Montar contexto com resultado de tarefas anteriores
        const contexto = tarefa.dependeDe
          ? tarefa.dependeDe
              .map((id) => this.resultados[id]?.codigo || '')
              .filter(Boolean)
              .join('\n')
          : '';

        await this.executarTarefa(tarefa, contexto);
      }

      // Fase 3: Relatorio final
      const concluidas = this.tarefas.filter((t) => t.status === STATUS.CONCLUIDO).length;
      const falharam = this.tarefas.filter((t) => t.status === STATUS.FALHOU).length;

      const relatorio = {
        objetivo,
        total: this.tarefas.length,
        concluidas,
        falharam,
        tarefas: this.tarefas,
        resultados: this.resultados,
      };

      this.onProgress({
        stage: 'concluido',
        message: `${concluidas}/${this.tarefas.length} tarefas concluidas`,
        relatorio,
      });

      return relatorio;
    } catch (err) {
      this.onProgress({
        stage: 'erro',
        message: `Erro no orquestrador: ${err.message}`,
      });
      throw err;
    } finally {
      this.rodando = false;
    }
  }

  // Para o loop
  parar() {
    this.rodando = false;
    this.onProgress({ stage: 'parado', message: 'Orquestrador parado pelo usuario' });
  }
}

export default Orchestrator;
