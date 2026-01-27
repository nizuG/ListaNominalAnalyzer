/* ================= ELEMENTOS ================= */

const input = document.getElementById('arquivo');
const info = document.getElementById('info');
const btnExibir = document.getElementById('bnt'); // Seleciona o botão e o container da tabela
const tabelaContainer = document.getElementById('tabela');
const filtro = document.getElementById('filtro');
const filtroIndicador = document.getElementById('filtro-indicador');
const filtroStatus = document.getElementById('filtro-status');
const filtroTexto = document.getElementById('filtro-texto');
const INDICADOR_COM_NM_DN = 'Cuidado da mulher e do homem transgênero na prevenção do câncer';
let dicionarioGlobais = {}; // guarda o dicionário
let indicadorAtual = '';
let dadosOriginais = [];
let dadosEquipe = [];
let dadosGlobais = []; // guarda os dados da tabela
let debounceBusca;

/* ================= EQUIPES ================= */

const equipes = [
    { codigo: '0002233843', nome: 'EAP CSII' },
    { codigo: '0002396068', nome: 'EAP CSII 02' },
    { codigo: '0002396033', nome: 'ESF CSII' },
    { codigo: '0001695223', nome: 'ESF Estação' },
    { codigo: '0002555913', nome: 'ESF Estação 02' },
    { codigo: '0002317206', nome: 'EAP Estação 02' },
    { codigo: '0002143143', nome: 'EAP Estação' },
    { codigo: '0002317184', nome: 'EAP Mathias 02' },
    { codigo: '0002140004', nome: 'EAP Mathias' },
    { codigo: '0002555905', nome: 'ESF Mathias 02' },
    { codigo: '0001695231', nome: 'ESF Mathias' },
    { codigo: '0002426005', nome: 'ESF Santana' },
    { codigo: '0000349186', nome: 'ESF Caporanga' },
    { codigo: '0000349151', nome: 'ESF Aureliana 02' },
    { codigo: '0000349178', nome: 'ESF Aureliana' },
    { codigo: '0000349100', nome: 'ESF Fabiano 02' },
    { codigo: '0000349097', nome: 'ESF Fabiano' },
    { codigo: '0001603957', nome: 'ESF São João' },
    { codigo: '0001520857', nome: 'ESF Parque' }
];

function obterNomeEquipe(codigo) {
    if (!codigo) return 'Município';

    const codigoLimpo = codigo.trim();
    const equipe = equipes.find(e => e.codigo === codigoLimpo);

    return equipe ? equipe.nome : codigoLimpo;
}

/* ================= EVENTO ================= */

input.addEventListener('change', () => {
    const arquivo = input.files[0];
    if (!arquivo) return;

    // Mostra o botão apenas quando um arquivo for carregado
    btnExibir.style.display = 'inline-block';

    // Opcional: esconde a tabela até clicar no botão
    tabelaContainer.style.display = 'none';

    const nome = arquivo.name.toLowerCase();

    if (nome.endsWith('.csv')) {
        processarCSV(arquivo);
        return;
    }

    if (nome.endsWith('.xlsx')) {
        processarXLSX(arquivo);
        return;
    }

    alert('Formato não suportado. Utilize CSV ou XLSX.');
});

filtroIndicador.addEventListener('change', () => {
    atualizarEstadoFiltroStatus();
    aplicarFiltrosCombinados();
});

filtroStatus.addEventListener('change', () => {
    aplicarFiltrosCombinados();
});

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('select-equipe');
    if (select) {
        select.addEventListener('change', aplicarFiltroEquipe);
    }
});

filtroTexto.addEventListener('input', () => {
    clearTimeout(debounceBusca);

    tabelaContainer.style.opacity = '0.4';

    debounceBusca = setTimeout(() => {
        aplicarFiltrosCombinados();
        tabelaContainer.style.opacity = '1';
    }, 180);
});





/* ================= EXIBIÇÃO ================= */

function atualizarInfo(meta, totalRegistros) {
    info.innerHTML = `
        <span class="item"><strong>Competência:</strong> ${meta.competencia || '-'}</span>
        <span class="item"><strong>Indicador:</strong> ${meta.indicador || '-'}</span>
        <span class="item"><strong>Equipe:</strong> ${obterNomeEquipe(meta.equipe)}</span>
        <span class="item"><strong>Registros:</strong> ${totalRegistros}</span>
    `;
}

/* ================= TABELA ================= */

function exibirDados(dados) {
    const container = document.getElementById('tabela');

    if (!dados || !dados.length) {
        container.innerHTML = '<p>Nenhum dado para exibir</p>';
        return;
    }

    let html = '<table><thead><tr>';

    Object.keys(dados[0]).forEach(coluna => {
        html += `<th>${coluna}</th>`;
    });

    html += '</tr></thead><tbody>';

    dados.forEach(linha => {
        html += '<tr>';
        Object.values(linha).forEach(valor => {
            html += `<td>${valor}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';

    container.innerHTML = html;
}

/* ================= DICIONÁRIO ================= */

function exibirDicionario(lista) {
    const container = document.getElementById('dicionario');

    if (!lista || !lista.length) {
        container.innerHTML = '';
        return;
    }

    let html = '<strong>Dicionário:</strong><ul>';

    lista.forEach(item => {
        html += `<li><strong>${item.coluna}</strong>: ${item.descricao}</li>`;
    });

    html += '</ul>';

    container.innerHTML = html;
}

/* ================= PERCENTUAL ================= */

/* ================= INDICADORES (A, B, C...) ================= */

function calcularPercentuaisUnificado(dados) {
    if (!dados.length) return [];

    const todasColunas = Object.keys(dados[0]);
    const resultado = [];

    // Detecta se existem colunas NM/DN
    const colunasNM = todasColunas.filter(c => c.startsWith('NM.'));
    const colunasApenas = todasColunas.filter(c => /^[A-Z]{1,2}$/.test(c) && c !== 'NM' && c !== 'DN');

    if (colunasNM.length) {
        // Formato NM/DN
        colunasNM.forEach(colNM => {
            const letra = colNM.split('.')[1];
            const colDN = `DN.${letra}`;

            let atingiu = 0;
            let total = 0;

            dados.forEach(linha => {
                if (valorValido(linha[colDN])) {
                    total++;
                    if (valorValido(linha[colNM])) atingiu++;
                }
            });

            const percentual = total ? Math.round((atingiu / total) * 100) : 0;

            resultado.push({
                indicador: letra,
                total: total,
                atingiu: atingiu,
                percentual
            });
        });
    } else {
        // Formato simples A, B, C...
        colunasApenas.forEach(col => {
            let contador = 0;
            const total = dados.length;

            dados.forEach(linha => {
                if (valorValido(linha[col])) contador++;
            });

            const percentual = total ? Math.round((contador / total) * 100) : 0;

            resultado.push({
                indicador: col,
                total: total,
                atingiu: contador,
                percentual
            });
        });
    }

    return resultado;
}


function exibirIndicadores(percentuais) {
    const container = document.getElementById('indicadores');
    if (!percentuais || !percentuais.length) {
        container.innerHTML = '<p>Nenhum indicador para exibir</p>';
        return;
    }

    let html = '';

    percentuais.forEach(item => {
        html += `
            <div class="indicador">
                <span class="letra">${item.indicador}</span>
            
                <div class="barra-fundo">
                    <div class="barra" style="width: ${item.percentual}%"></div>
                </div>
                <span class="percentual">${item.percentual}%</span>
                
            </div>
        `;
    });

    container.innerHTML = html;
}

// Função para verificar se um valor conta como "atingido"
function valorValido(v) {
    if (v === null || v === undefined) return false;
    const valor = String(v).trim().toUpperCase();
    return valor === 'X' || valor === '1' || valor === 'TRUE';
}



btnExibir.addEventListener('click', (e) => {
    e.preventDefault(); // evita que o link navegue
    tabelaContainer.style.display = 'block'; // mostra a tabela
    filtro.style.display = 'block';
    tabelaContainer.scrollIntoView({ behavior: 'smooth' }); // rola até a tabela
    // Esconde o botão após o clique
    btnExibir.style.display = 'none';
});

function atualizarEstadoFiltroStatus() {
    if (!filtroIndicador.value) {
        filtroStatus.value = 'todos';
        filtroStatus.disabled = true;
        filtroStatus.style.opacity = '0.5';
        filtroStatus.style.cursor = 'not-allowed';
    } else {
        filtroStatus.disabled = false;
        filtroStatus.style.opacity = '1';
        filtroStatus.style.cursor = 'pointer';
    }
}



function gerarOpcoesFiltro(dados) {
    if (!dados.length) return;

    const colunas = Object.keys(dados[0]);

    const usarNM =
        indicadorAtual === INDICADOR_COM_NM_DN;

    let indicadores;

    if (usarNM) {
        // Apenas NM.X
        indicadores = colunas.filter(c => /^NM\.[A-Z]$/i.test(c));
    } else {
        // Apenas A, B, C...
        indicadores = colunas.filter(c => /^[A-Z]$/.test(c));
    }

    filtroIndicador.innerHTML = '<option value="">Todos</option>';

    indicadores.forEach(indicador => {
        let texto = indicador;

        if (usarNM) {
            const totalValidos = contarValidosIndicador(dados, indicador);
            texto = `${indicador} (${totalValidos} válidos)`;
        }

        const option = document.createElement('option');
        option.value = indicador;
        option.textContent = texto;

        filtroIndicador.appendChild(option);
    });
}



function verificarStatusIndicador(linha, indicador, status) {

    // ================= NM.X =================
    if (indicador.startsWith('NM.')) {
        const letra = indicador.split('.')[1];

        // aceita DN ou DM
        const dn = linha[`DN.${letra}`] ?? linha[`DM.${letra}`];
        const nm = linha[`NM.${letra}`];

        // REGRA FUNDAMENTAL:
        // se DN/DM não for X, a pessoa NÃO pertence ao indicador
        if (!valorValido(dn)) return false;

        if (status === 'atingiu') return valorValido(nm);
        if (status === 'vazio') return !valorValido(nm);
        return true; // todos (válidos)
    }

    // ================= A, B, C =================
    const valor = linha[indicador];
    if (valor === undefined) return false;

    if (status === 'atingiu') return valorValido(valor);
    if (status === 'vazio') return !valorValido(valor);
    return true;
}

function aplicarFiltrosCombinados() {
    let dados = [...dadosEquipe]; // já vem filtrado por equipe

    const indicador = filtroIndicador.value;
    const status = filtroStatus.value;
    const texto = filtroTexto.value.trim();

    // filtro indicador/status
    if (indicador) {
        dados = dados.filter(linha =>
            verificarStatusIndicador(linha, indicador, status)
        );
    }

    // filtro CPF / CNS
    if (texto) {
        const busca = texto.replace(/\D/g, '');

        dados = dados.filter(linha => {
            const cpf = (linha.CPF || '').replace(/\D/g, '');
            const cns = (linha.CNS || '').replace(/\D/g, '');
            return cpf.includes(busca) || cns.includes(busca);
        });
    }

    exibirDados(dados);
}

function contarValidosIndicador(dados, indicador) {
    let total = 0;
    const letra = indicador.split('.')[1];

    dados.forEach(linha => {
        const dn =
            linha[`DN.${letra}`] ??
            linha[`DM.${letra}`];

        if (valorValido(dn)) total++;
    });

    return total;
}

function configurarFiltroEquipe(meta, dados) {
    const filtroEquipe = document.getElementById('filtro-equipe');
    const selectEquipe = document.getElementById('select-equipe');

    // Se já existe equipe no metadata, NÃO é municipal
    if (meta.equipe) {
        filtroEquipe.style.display = 'none';
        return;
    }

    // Arquivo municipal
    filtroEquipe.style.display = 'flex';

    // limpa opções
    selectEquipe.innerHTML = '<option value="">Todas</option>';

    // detecta colunas possíveis
    const colunas = Object.keys(dados[0] || {});
    let colEquipe = null;

    if (colunas.includes('INE')) colEquipe = 'INE';
    else if (colunas.includes('CNES')) colEquipe = 'CNES';

    if (!colEquipe) return;


    // equipes presentes no arquivo
    const equipesPresentes = [...new Set(
        dados
            .map(d => d[colEquipe])
            .filter(v => v)
    )];

    equipesPresentes.forEach(codigo => {
        const opt = document.createElement('option');
        opt.value = codigo;
        opt.textContent = obterNomeEquipe(codigo);
        selectEquipe.appendChild(opt);
    });
}

function aplicarFiltroEquipe() {
    const select = document.getElementById('select-equipe');
    const codigoEquipe = select.value;

    if (!codigoEquipe) {
        dadosEquipe = [...dadosOriginais];
    } else {
        dadosEquipe = dadosOriginais.filter(linha =>
            linha.INE === codigoEquipe ||
            linha.CNES === codigoEquipe
        );
    }

    // atualiza tudo com base na equipe
    dadosGlobais = dadosEquipe;

    const percentuais = calcularPercentuaisUnificado(dadosEquipe);
    exibirIndicadores(percentuais);
    gerarOpcoesFiltro(dadosEquipe);
    aplicarFiltrosCombinados();
    atualizarInfoEquipe(dadosEquipe);
    
}

function atualizarInfoEquipe(dados) {
    const total = dados.length;

    const span = document.querySelector('#info .item:last-child');
    if (span) {
        span.innerHTML = `<strong>Registros:</strong> ${total}`;
    }
}