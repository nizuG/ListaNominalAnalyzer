// XLSX

function processarXLSX(arquivo) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: ''
    });

    const meta = extrairMetadadosXLSX(linhas);
    const dados = extrairDadosXLSX(linhas);
    const dicionario = extrairDicionarioXLSX(linhas);
    const percentuais = calcularPercentuaisUnificado(dados);
    
    window.dadosGlobais = dados;
    dicionarioGlobais = dicionario;
    indicadorAtual = meta.indicador || '';
    dadosOriginais = dados;
    dadosEquipe = dados;
    dadosGlobais = dados;

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

  reader.readAsArrayBuffer(arquivo);
}

function extrairMetadadosXLSX(linhas) {
  let competencia = '';
  let indicador = '';
  let equipe = '';

  linhas.forEach(linha => {
    linha.forEach(celula => {
      if (typeof celula !== 'string') return;

      if (celula.includes('Competência selecionada:'))
        competencia = celula.split('Competência selecionada:')[1].trim();

      if (celula.includes('Indicador selecionado:'))
        indicador = celula.split('Indicador selecionado:')[1].trim();

      if (celula.includes('Equipe Selecionada:'))
        equipe = celula.split('Equipe Selecionada:')[1].trim();
    });
  });

  return { competencia, indicador, equipe };
}

function extrairDadosXLSX(linhas) {
  const inicio = linhas.findIndex(l => l.includes('CPF'));
  if (inicio === -1) return [];

  const headers = linhas[inicio];
  const dados = [];

  for (let i = inicio + 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha) continue;

    // pega CPF e CNS
    const cpf = linha[headers.indexOf('CPF')] ?? '';
    const cns = linha[headers.indexOf('CNS')] ?? '';

    // se CPF e CNS vazios, significa que a linha não é paciente → parar leitura
    if (!cpf && !cns) break;

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = linha[idx] ?? '';
    });

    dados.push(obj);
  }

  return dados;
}


function extrairDicionarioXLSX(linhas) {
  const inicio = linhas.findIndex(l =>
    l.some(c => c === 'Dicionário')
  );

  if (inicio === -1) return [];

  const lista = [];

  for (let i = inicio + 2; i < linhas.length; i++) {
    if (!linhas[i] || !linhas[i][0]) break;

    lista.push({
      coluna: linhas[i][0],
      descricao: linhas[i][1] || ''
    });
  }

  return lista;
}
