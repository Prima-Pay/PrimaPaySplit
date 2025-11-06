// Aguarda o documento HTML carregar completamente
document.addEventListener('DOMContentLoaded', () => {

    // --- 0. BANCO DE DADOS DOS ANEXOS ---
    // Armazena as tabelas do Simples Nacional em um objeto
    const ANEXOS_SIMPLES = {
        anexoI: {
            nome: "Anexo I - Comércio",
            faixas: [
                { ate: 180000, aliquota: 0.040, deduzir: 0 },
                { ate: 360000, aliquota: 0.073, deduzir: 5940 },
                { ate: 720000, aliquota: 0.095, deduzir: 13860 },
                { ate: 1800000, aliquota: 0.107, deduzir: 22500 },
                { ate: 3600000, aliquota: 0.143, deduzir: 87300 },
                { ate: 4800000, aliquota: 0.190, deduzir: 378000 }
            ]
        },
        anexoII: {
            nome: "Anexo II - Indústria",
            faixas: [
                { ate: 180000, aliquota: 0.045, deduzir: 0 },
                { ate: 360000, aliquota: 0.078, deduzir: 5940 },
                { ate: 720000, aliquota: 0.100, deduzir: 13860 },
                { ate: 1800000, aliquota: 0.112, deduzir: 22500 },
                { ate: 3600000, aliquota: 0.147, deduzir: 85500 },
                { ate: 4800000, aliquota: 0.300, deduzir: 720000 }
            ]
        },
        anexoIII: {
            nome: "Anexo III - Serviços (Gerais)",
            faixas: [
                { ate: 180000, aliquota: 0.060, deduzir: 0 },
                { ate: 360000, aliquota: 0.112, deduzir: 9360 },
                { ate: 720000, aliquota: 0.135, deduzir: 17640 },
                { ate: 1800000, aliquota: 0.160, deduzir: 35640 },
                { ate: 3600000, aliquota: 0.210, deduzir: 125640 },
                { ate: 4800000, aliquota: 0.330, deduzir: 648000 }
            ]
        },
        anexoIV: {
            nome: "Anexo IV - Serviços (Obras, Advocacia...)",
            faixas: [
                { ate: 180000, aliquota: 0.045, deduzir: 0 },
                { ate: 360000, aliquota: 0.090, deduzir: 8100 },
                { ate: 720000, aliquota: 0.102, deduzir: 12420 },
                { ate: 1800000, aliquota: 0.140, deduzir: 39780 },
                { ate: 3600000, aliquota: 0.220, deduzir: 183780 },
                { ate: 4800000, aliquota: 0.330, deduzir: 828000 }
            ]
        },
        anexoV: {
            nome: "Anexo V - Serviços (Intelectuais)",
            faixas: [
                { ate: 180000, aliquota: 0.155, deduzir: 0 },
                { ate: 360000, aliquota: 0.180, deduzir: 4500 },
                { ate: 720000, aliquota: 0.195, deduzir: 9900 },
                { ate: 1800000, aliquota: 0.205, deduzir: 17100 },
                { ate: 3600000, aliquota: 0.230, deduzir: 62100 },
                { ate: 4800000, aliquota: 0.305, deduzir: 540000 }
            ]
        }
    };

    // --- 1. SELEÇÃO DOS ELEMENTOS DO HTML ---
    const form = document.getElementById('split-form');
    const resultsContainer = document.getElementById('results-container');
    
    // Inputs
    const atividadePrincipalSelect = document.getElementById('atividade-principal');
    const tipoServicoGroup = document.getElementById('tipo-servico-group');
    const tipoServicoSelect = document.getElementById('tipo-servico');

    const faturamentoInput = document.getElementById('faturamento-total');
    const faturamentoSlider = document.getElementById('faturamento-slider');
    const comissaoInput = document.getElementById('comissao-percent');
    const comissaoSlider = document.getElementById('comissao-slider');

    // Resultados
    const ratesTitle = document.getElementById('rates-title');
    const ratesDisplay = document.getElementById('rates-display');
    const impostoSemSplitSpan = document.getElementById('imposto-sem-split');
    const impostoComSplitSpan = document.getElementById('imposto-com-split');
    const economiaImpostoMesSpan = document.getElementById('economia-imposto-mes');
    const economiaImpostoAnoSpan = document.getElementById('economia-imposto-ano');
    
    // --- 2. EVENT LISTENERS ---

    // Mostra/oculta o seletor de "Tipo de Serviço"
    atividadePrincipalSelect.addEventListener('change', (e) => {
        if (e.target.value === 'servicos') {
            tipoServicoGroup.classList.remove('hidden');
        } else {
            tipoServicoGroup.classList.add('hidden');
        }
    });

    // Sincroniza o Slider e o Input de Faturamento
    faturamentoSlider.addEventListener('input', (e) => { faturamentoInput.value = e.target.value; });
    faturamentoInput.addEventListener('input', (e) => {
        if (parseFloat(e.target.value) > 500000) e.target.value = 500000;
        faturamentoSlider.value = e.target.value;
    });

    // Sincroniza o Slider e o Input de Comissão
    comissaoSlider.addEventListener('input', (e) => { comissaoInput.value = e.target.value; });
    comissaoInput.addEventListener('input', (e) => {
        if (parseFloat(e.target.value) > 99) e.target.value = 99;
        if (parseFloat(e.target.value) < 1) e.target.value = 1;
        comissaoSlider.value = e.target.value;
    });

    // Listener principal do formulário
    form.addEventListener('submit', (event) => {
        event.preventDefault(); 
        const resultados = calcularSimulacaoSplit();
        if (resultados) {
            exibirResultados(resultados);
        }
    });

    // --- 3. FUNÇÕES DE CÁLCULO ---

    /**
     * Calcula o imposto Simples Nacional (GENERALIZADO)
     * com base no faturamento e no Anexo escolhido.
     */
    function calcularImpostoSimples(valorBase, anexoKey) {
        
        const anexoData = ANEXOS_SIMPLES[anexoKey];
        if (!anexoData) {
            console.error("Anexo não encontrado:", anexoKey);
            return { impostoProporcional: 0, aliquotaEfetivaFmt: '0.00', nomeFaixa: 'N/A' };
        }

        const faixas = anexoData.faixas;
        const RBT12 = valorBase * 12; // Estima o faturamento anual (RBT12)
        
        let aliquotaNominal, valorDeducao, nomeFaixa;
        let faixaEncontrada = faixas[faixas.length - 1]; // Padrão: última faixa

        // Encontra a faixa correta
        for (let i = 0; i < faixas.length; i++) {
            if (RBT12 <= faixas[i].ate) {
                faixaEncontrada = faixas[i];
                nomeFaixa = `Faixa ${i + 1}`;
                break;
            }
        }
        // Se RBT12 for maior que a última faixa
        if (!nomeFaixa) {
             nomeFaixa = `Faixa ${faixas.length}`;
        }

        aliquotaNominal = faixaEncontrada.aliquota;
        valorDeducao = faixaEncontrada.deduzir;

        let aliquotaEfetiva = (RBT12 * aliquotaNominal - valorDeducao) / RBT12;
        
        // A alíquota efetiva não pode ser menor que a alíquota da 1ª faixa (para Anexos III e V)
        const aliquotaMinima = faixas[0].aliquota;
        if (aliquotaEfetiva < aliquotaMinima) {
            aliquotaEfetiva = aliquotaMinima;
        }
        
        // Imposto proporcional ao valor base (mensal)
        const impostoProporcional = valorBase * aliquotaEfetiva;
        const aliquotaEfetivaFmt = (aliquotaEfetiva * 100).toFixed(2); // Formata para "4.83"

        return { impostoProporcional, aliquotaEfetivaFmt, nomeFaixa, nomeAnexo: anexoData.nome };
    }

    /**
     * Função principal que calcula a diferença de imposto
     */
    function calcularSimulacaoSplit() {
        const faturamentoTotal = parseFloat(faturamentoInput.value);
        const comissaoPercent = parseFloat(comissaoInput.value) / 100;
        
        if (isNaN(faturamentoTotal) || faturamentoTotal <= 0) {
            alert('Por favor, insira um valor de faturamento válido.');
            return;
        }

        // --- Lógica para determinar o Anexo ---
        const atividade = atividadePrincipalSelect.value;
        const tipoServico = tipoServicoSelect.value;
        let anexoKey;

        switch (atividade) {
            case 'comercio':
                anexoKey = 'anexoI';
                break;
            case 'industria':
                anexoKey = 'anexoII';
                break;
            case 'servicos':
                switch (tipoServico) {
                    case 'servicos-gerais':
                        anexoKey = 'anexoIII';
                        break;
                    case 'servicos-intelectuais':
                        anexoKey = 'anexoV';
                        break;
                    case 'servicos-obras':
                    case 'advocacia':
                        anexoKey = 'anexoIV';
                        break;
                }
                break;
        }
        // ----------------------------------------

        const valorComissao = faturamentoTotal * comissaoPercent;

        // 1. Cálculo Errado (Sem Split)
        const impostoErrado = calcularImpostoSimples(faturamentoTotal, anexoKey);

        // 2. Cálculo Certo (Com Split)
        const impostoCerto = calcularImpostoSimples(valorComissao, anexoKey);

        // 3. Economia
        const economiaMes = impostoErrado.impostoProporcional - impostoCerto.impostoProporcional;
        const economiaAno = economiaMes * 12;

        return {
            impostoSemSplit: impostoErrado.impostoProporcional,
            impostoComSplit: impostoCerto.impostoProporcional,
            economiaMes: economiaMes,
            economiaAno: economiaAno,
            aliquotaErrada: impostoErrado.aliquotaEfetivaFmt,
            aliquotaCerta: impostoCerto.aliquotaEfetivaFmt,
            faixaErrada: impostoErrado.nomeFaixa,
            faixaCerta: impostoCerto.nomeFaixa,
            nomeAnexo: impostoCerto.nomeAnexo // Passa o nome do anexo para exibição
        };
    }

    // --- 4. FUNÇÃO DE EXIBIÇÃO ---
    function exibirResultados(resultados) {
        const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Atualiza o TÍTULO da seção
        ratesTitle.textContent = `Comparativo de Imposto (${resultados.nomeAnexo})`;

        // Atualiza as alíquotas de imposto
        ratesDisplay.innerHTML = `
            <p>Alíquota (Sem Split - ${resultados.faixaErrada}): <strong>${resultados.aliquotaErrada}%</strong></p>
            <p>Alíquota (Com Split - ${resultados.faixaCerta}): <strong>${resultados.aliquotaCerta}%</strong></p>
        `;

        // Atualiza a comparação de impostos
        impostoSemSplitSpan.textContent = formatBRL(resultados.impostoSemSplit);
        impostoComSplitSpan.textContent = formatBRL(resultados.impostoComSplit);

        // Atualiza o destaque de economia
        economiaImpostoMesSpan.textContent = formatBRL(resultados.economiaMes);
        economiaImpostoAnoSpan.textContent = formatBRL(resultados.economiaAno);

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});