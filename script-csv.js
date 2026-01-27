// CSV

function processarCSV(arquivo) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const texto = e.target.result;

    const meta = extrairMetadadosCSV(texto);
    const dados = csvParaObjeto(texto);
    const dicionario = extrairDicionarioCSV(texto);
    const percentuais = calcularPercentuaisUnificado(dados);


    window.dadosGlobais = dados;
    dadosGlobais = dados;
    dicionarioGlobais = dicionario;
    indicadorAtual = meta.indicador || '';
    dadosEquipe = dados;
    dadosOriginais = dados;


    atualizarEstadoFiltroStatus();
    exibirDados(dados);
    atualizarInfo(meta, dados.length);
    configurarFiltroEquipe(meta, dados);
    exibirDados(dados);
    exibirDicionario(dicionario);
    exibirIndicadores(percentuais);
    gerarOpcoesFiltro(dados); // gera filtro dinâmico
    filtro.style.display = 'none';

  };

  reader.readAsText(arquivo);
}

function extrairMetadadosCSV(texto) {
  const linhas = texto.split('\n').map(l => l.trim());

  let competencia = '';
  let indicador = '';
  let equipe = '';

  linhas.forEach(linha => {
    if (linha.startsWith('Competência selecionada:'))
      competencia = linha.split(':').slice(1).join(':').trim();

    if (linha.startsWith('Indicador selecionado:'))
      indicador = linha.split(':').slice(1).join(':').trim();

    if (linha.startsWith('Equipe Selecionada:'))
      equipe = linha.split(':').slice(1).join(':').trim();
  });

  return { competencia, indicador, equipe };
}

function csvParaObjeto(texto) {
  const linhas = texto.split('\n').map(l => l.trim());
  const inicio = linhas.findIndex(l => l.startsWith('CPF;'));

  if (inicio === -1) return [];

  const headers = linhas[inicio].split(';');
  const dados = [];

  for (let i = inicio + 1; i < linhas.length; i++) {
    const linha = linhas[i];

    // pula linhas vazias
    if (!linha) continue;

    // ignora linhas de final de tabela
    if (linha.startsWith('Fonte:') || linha.startsWith('"Dicionário"') || linha.startsWith('"Coluna"')) break;

    const valores = linha.split(';');
    const obj = {};

    headers.forEach((h, idx) => {
      obj[h] = (valores[idx] || '').replace(/^"|"$/g, '');
    });

    // só adiciona se CPF ou CNS estiver preenchido
    if (obj['CPF'] || obj['CNS']) {
      dados.push(obj);
    }
  }

  return dados;
}

function extrairDicionarioCSV(texto) {
  const linhas = texto.split('\n').map(l => l.trim());
  const inicio = linhas.findIndex(l => l.replace(/"/g, '') === 'Dicionário');
  if (inicio === -1) return [];

  const lista = [];

  for (let i = inicio + 2; i < linhas.length; i++) {
    if (!linhas[i] || linhas[i] === '""') break;

    const [coluna, descricao] = linhas[i]
      .split(';')
      .map(v => v.replace(/^"|"$/g, ''));

    lista.push({ coluna, descricao });
  }

  return lista;
}
