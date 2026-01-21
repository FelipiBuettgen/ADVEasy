import { Deal, Stage } from '../types';

// Subset of the provided data to ensure the app runs standalone without external API initially
export const MOCK_DEALS: Deal[] = [
  {
    "id": 2447,
    "title": "Regiane Do Rocio Fernandes Berrisch",
    "value": 158.0,
    "currency": "BRL",
    "add_time": "2022-08-19T19:49:42Z",
    "status": "won",
    "pipeline_id": 7,
    "stage_id": 67,
    "won_time": "2025-06-05T03:00:00Z",
    "lost_time": null,
    "close_time": "2025-06-05T03:00:00Z",
    "owner_id": 14587332,
    "lost_reason": null
  },
  {
    "id": 2475,
    "title": "ANDERSON BAHIA DA SILVA",
    "value": 165.0,
    "currency": "BRL",
    "add_time": "2023-03-11T21:41:39Z",
    "status": "won",
    "pipeline_id": 7,
    "stage_id": 67,
    "won_time": "2025-09-26T03:00:00Z",
    "lost_time": null,
    "close_time": "2025-09-26T03:00:00Z",
    "owner_id": 14587332,
    "lost_reason": null
  },
  {
    "id": 2391,
    "title": "Anderlon Junqueira",
    "value": 1500.0, 
    "currency": "BRL",
    "add_time": "2022-12-29T16:52:21Z",
    "status": "lost",
    "pipeline_id": 2,
    "stage_id": 8,
    "won_time": null,
    "lost_time": "2025-11-01T03:00:00Z", // Mocked future date for chart viz
    "close_time": "2025-11-01T03:00:00Z",
    "owner_id": 14587332,
    "lost_reason": "Reprovado | Sem perfil"
  },
  {
    "id": 2696,
    "title": "Francisco Gomes Dos Reis Brandileone",
    "value": 1068.0,
    "currency": "BRL",
    "add_time": "2023-08-09T19:07:32Z",
    "status": "won",
    "pipeline_id": 7,
    "stage_id": 67,
    "won_time": "2025-11-13T03:00:00Z",
    "lost_time": null,
    "close_time": "2023-11-13T03:00:00Z",
    "owner_id": 14587332,
    "lost_reason": null
  },
   {
    "id": 2638,
    "title": "Eduardo Henrique Pereira",
    "value": 468.0,
    "currency": "BRL",
    "add_time": "2023-07-09T23:28:09Z",
    "status": "won",
    "pipeline_id": 7,
    "stage_id": 67,
    "won_time": "2025-10-18T03:00:00Z",
    "lost_time": null,
    "close_time": "2023-10-18T03:00:00Z",
    "owner_id": 14587332,
    "lost_reason": null
  },
  {
      "id": 2624,
      "title": "Douglas Repo Teste",
      "value": 2500.0,
      "currency": "BRL",
      "status": "lost",
      "pipeline_id": 5, 
      "stage_id": 8,
      "add_time": "2023-11-13T15:43:16Z",
      "won_time": null,
      "lost_time": "2025-11-15T03:00:00Z",
      "close_time": "2023-11-15T03:00:00Z",
      "owner_id": 14587332,
      "lost_reason": "Sem Perfil"
  },
  // Adding open deals for pipeline visualization
  {
      "id": 2614,
      "title": "Diego Da Silva Patricio",
      "value": 5000.0,
      "currency": "BRL",
      "status": "open",
      "pipeline_id": 2,
      "stage_id": 9,
      "add_time": "2023-10-02T00:19:34Z",
      "won_time": null,
      "lost_time": null,
      "close_time": null,
      "owner_id": 14587332,
      "lost_reason": null
  },
    {
      "id": 2615,
      "title": "Diogo Denes",
      "value": 12000.0,
      "currency": "BRL",
      "status": "open",
      "pipeline_id": 5,
      "stage_id": 9,
      "add_time": "2023-10-02T00:19:34Z",
      "won_time": null,
      "lost_time": null,
      "close_time": null,
      "owner_id": 14587332,
      "lost_reason": null
  }
];

export const MOCK_STAGES: Stage[] = [
    { id: 6, name: "Novo Cadastro Recebido", pipeline_id: 2, pipeline_name: "Pré-vendas | AdvEasy" },
    { id: 64, name: "Oportunidade Gerada", pipeline_id: 7, pipeline_name: "Sales | AdvEasy" },
    { id: 21, name: "Boas vindas ao Onboarding", pipeline_id: 5, pipeline_name: "CS | AdvEasy" },
    // Add representative stages for mapping
    { id: 67, name: "Aguardando Pagamento", pipeline_id: 7, pipeline_name: "Sales | AdvEasy" },
    { id: 8, name: "Pré-Qualificação Comercial", pipeline_id: 2, pipeline_name: "Pré-vendas | AdvEasy" }
];