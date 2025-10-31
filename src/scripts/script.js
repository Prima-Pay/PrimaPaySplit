// Aguarda o documento HTML carregar completamente
document.addEventListener('DOMContentLoaded', () => {

    const taxas = {
        primaPay: {
            naHora: {
                debito: 1.29,
                credito: 2.89,
                parcelado: { 
                    "default": 6.73, // 6x
                    "2": 4.55, "3": 5.29, "4": 5.78, "5": 6.01, "6": 6.73,
                    "7": 5.78, "8": 8.65, "9": 9.35, "10": 10.73, "11": 11.40,
                    "12": 12.07, "13": 13.14, "14": 13.79, "15": 14.45, "16": 15.09,
                    "17": 15.73, "18": 16.36
                }
            },
            umDia: {
                debito: 1.89, 
                credito: 2.95, 
                parcelado: { 
                    "default": 8.11, // 6x
                    "2": 4.99, "3": 5.78, "4": 6.56, "5": 7.34, "6": 8.11,
                    "7": 8.52, "8": 10.27, "9": 11.02, "10": 11.76, "11": 12.48,
                    "12": 13.21, "13": 14.31, "14": 15.02, "15": 15.72, "16": 16.41,
                    "17": 17.09, "18": 17.76
                }
            }
        },
        tradicional: {
            naHora: { 
                debito: 2.49,
                credito: 4.49,
                parcelado: {
                    "default": 8.23,
                    "2": 5.75, "3": 6.59, "4": 7.18, "5": 7.41, "6": 8.23,
                    "7": 7.18, "8": 10.25, "9": 11.05, "10": 12.53, "11": 13.20,
                    "12": 13.97, "13": 15.14, "14": 15.79, "15": 16.45, "16": 17.19,
                    "17": 17.83, "18": 18.46
                }
            },
            umDia: {
                debito: 2.99,
                credito: 4.99,
                parcelado: {
                    "default": 9.61,
                    "2": 6.29, "3": 7.18, "4": 8.06, "5": 8.94, "6": 9.61,
                    "7": 10.12, "8": 11.97, "9": 12.82, "10": 13.56, "11": 14.28,
                    "12": 15.11, "13": 16.31, "14": 17.02, "15": 17.72, "16": 18.41,
                    "17": 19.19, "18": 19.96
                }
            }
        }
    };

    const form = document.getElementById('simulation-form');
    const resultsContainer = document.getElementById('results-container');
    const errorDiv = document.getElementById('percentage-error');

    const radiosTipoSimulacao = document.querySelectorAll('input[name="tipo-simulacao"]');
    const camposMensal = document.getElementById('simulacao-mensal-fields');
    const camposVenda = document.getElementById('simulacao-venda-fields');
    
    // Elementos do MENSAL
    const faturamentoInput = document.getElementById('faturamento-mensal');
    const debitoInput = document.getElementById('percent-debito');
    const creditoInput = document.getElementById('percent-credito');
    const parceladoInput = document.getElementById('percent-parcelado');
    // SELETOR MENSAL
    const parcelasMensalGroup = document.getElementById('parcelas-mensal-group');
    const parcelasMensalSelect = document.getElementById('parcelas-mensal-select');

    // Elementos do VENDA
    const valorVendaInput = document.getElementById('valor-venda');
    const radiosTipoTransacao = document.querySelectorAll('input[name="tipo-transacao"]');
    const parcelasSelectGroup = document.getElementById('parcelas-select-group');
    const numeroParcelasSelect = document.getElementById('numero-parcelas');

    // Elementos de resultado
    const ratesTitle = document.getElementById('rates-title');
    const ratesDisplay = document.getElementById('rates-display');
    const primaTotalSpan = document.getElementById('prima-total');
    const tradTotalSpan = document.getElementById('trad-total');
    
    const economiaMesLabel = document.getElementById('economia-mes-label');
    const economiaMesSpan = document.getElementById('economia-mes');
    const economiaAnoContainer = document.getElementById('economia-ano-container');

    // --- 3. EVENT LISTENERS

    // Listener para trocar entre "Mensal" e "Venda"
    radiosTipoSimulacao.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'mensal') {
                camposMensal.style.display = 'block';
                camposVenda.style.display = 'none';
                errorDiv.style.display = 'none';

                //Verifica se o seletor de parcelas mensal deve aparecer
                const percent = parseFloat(parceladoInput.value);
                if (percent > 0) {
                    parcelasMensalGroup.style.display = 'block';
                } else {
                    parcelasMensalGroup.style.display = 'none';
                }
            } else {
                camposMensal.style.display = 'none';
                camposVenda.style.display = 'block';
                errorDiv.style.display = 'none'; 
                parcelasMensalGroup.style.display = 'none';
            }
        });
    });

    // Listener para mostrar/esconder o seletor de parcelas (VENDA)
    radiosTipoTransacao.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'parcelado') {
                parcelasSelectGroup.style.display = 'block';
            } else {
                parcelasSelectGroup.style.display = 'none';
            }
        });
    });

    parceladoInput.addEventListener('input', () => {
        const percent = parseFloat(parceladoInput.value);
        if (percent > 0) {
            parcelasMensalGroup.style.display = 'block';
        } else {
            parcelasMensalGroup.style.display = 'none';
        }
    });


    // Listener principal do formulário
    form.addEventListener('submit', (event) => {
        event.preventDefault(); 
        
        const simType = document.querySelector('input[name="tipo-simulacao"]:checked').value;
        let resultados;

        if (simType === 'mensal') {
            if (!validarPorcentagens()) {
                return; 
            }
            resultados = calcularSimulacaoMensal();
        } else {
            resultados = calcularSimulacaoVenda();
        }
        
        if (resultados) {
            exibirResultados(resultados);
        }
    });


    function validarPorcentagens() {
        const deb = parseFloat(debitoInput.value) || 0;
        const cre = parseFloat(creditoInput.value) || 0;
        const par = parseFloat(parceladoInput.value) || 0;
        const total = deb + cre + par;

        if (total !== 100) {
            errorDiv.style.display = 'block';
            return false;
        } else {
            errorDiv.style.display = 'none';
            return true;
        }
    }

    function calcularSimulacaoMensal() {
        const faturamento = parseFloat(faturamentoInput.value);
        if (isNaN(faturamento) || faturamento <= 0) {
            alert('Por favor, insira um valor de faturamento válido.');
            return;
        }

        const pDeb = (parseFloat(debitoInput.value) || 0) / 100;
        const pCre = (parseFloat(creditoInput.value) || 0) / 100;
        const pPar = (parseFloat(parceladoInput.value) || 0) / 100;
        
        const prazoSelecionado = document.querySelector('input[name="prazo-recebimento"]:checked').value;
        const nomePlano = (prazoSelecionado === 'naHora') ? "Na Hora" : "Um Dia Útil";

        const taxasPrima = taxas.primaPay[prazoSelecionado];
        const taxasTrad = taxas.tradicional[prazoSelecionado];

        const parcelasMedia = parcelasMensalSelect.value;
        
        const taxaParceladoPrima = taxasPrima.parcelado[parcelasMedia];
        const taxaParceladoTrad = taxasTrad.parcelado[parcelasMedia];

        const fatDebito = faturamento * pDeb;
        const fatCredito = faturamento * pCre;
        const fatParcelado = faturamento * pPar;

        const descontoPrima = (fatDebito * (taxasPrima.debito / 100)) +
                              (fatCredito * (taxasPrima.credito / 100)) +
                              (fatParcelado * (taxaParceladoPrima / 100));

        const descontoTrad = (fatDebito * (taxasTrad.debito / 100)) +
                             (fatCredito * (taxasTrad.credito / 100)) +
                             (fatParcelado * (taxaParceladoTrad / 100));

        const totalPrima = faturamento - descontoPrima;
        const totalTrad = faturamento - descontoTrad;
        const economiaMes = descontoTrad - descontoPrima;
        const economiaAno = economiaMes * 12;

        const taxasExibicao = {
            debito: taxasPrima.debito,
            credito: taxasPrima.credito,
            parcelado: taxaParceladoPrima 
        };

        return { simType: 'mensal', totalPrima, totalTrad, economiaMes, economiaAno, taxasExibicao, nomePlano, parcelasMedia };
    }

    function calcularSimulacaoVenda() {
        const faturamento = parseFloat(valorVendaInput.value);
        if (isNaN(faturamento) || faturamento <= 0) {
            alert('Por favor, insira um valor de venda válido.');
            return;
        }

        const tipoTransacao = document.querySelector('input[name="tipo-transacao"]:checked').value;
        const prazoSelecionado = document.querySelector('input[name="prazo-recebimento"]:checked').value;
        const nomePlano = (prazoSelecionado === 'naHora') ? "Na Hora" : "Um Dia Útil";
        
        const taxasPrima = taxas.primaPay[prazoSelecionado];
        const taxasTrad = taxas.tradicional[prazoSelecionado];
        
        let taxaP, taxaT;
        let nomeTaxa = tipoTransacao;

        switch (tipoTransacao) {
            case 'debito':
                taxaP = taxasPrima.debito;
                taxaT = taxasTrad.debito;
                nomeTaxa = "Débito";
                break;
            case 'credito':
                taxaP = taxasPrima.credito;
                taxaT = taxasTrad.credito;
                nomeTaxa = "Crédito à Vista";
                break;
            case 'parcelado':
                const parcelas = numeroParcelasSelect.value;
                taxaP = taxasPrima.parcelado[parcelas];
                taxaT = taxasTrad.parcelado[parcelas];
                nomeTaxa = `Parcelado ${parcelas}x`;
                break;
        }

        const descontoPrima = faturamento * (taxaP / 100);
        const descontoTrad = faturamento * (taxaT / 100);

        const totalPrima = faturamento - descontoPrima;
        const totalTrad = faturamento - descontoTrad;
        const economiaMes = descontoTrad - descontoPrima; 
        const economiaAno = 0; 

        const taxasExibicao = { [nomeTaxa]: taxaP };

        return { simType: 'venda', totalPrima, totalTrad, economiaMes, economiaAno, taxasExibicao, nomePlano };
    }


    function exibirResultados(resultados) {
        const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        ratesTitle.textContent = `Nossas taxas para o plano "${resultados.nomePlano}":`;
        
        ratesDisplay.innerHTML = ''; // Limpa as taxas anteriores
        if (resultados.simType === 'mensal') {
            // Mostra débito e crédito
            ratesDisplay.innerHTML = `
                <p>Débito: <strong>${resultados.taxasExibicao.debito}%</strong></p>
                <p>Crédito: <strong>${resultados.taxasExibicao.credito}%</strong></p>
            `;

            if (parseFloat(parceladoInput.value) > 0) {
                ratesDisplay.innerHTML += `
                    <p>Parcelado (Média ${resultados.parcelasMedia}x): <strong>${resultados.taxasExibicao.parcelado}%</strong></p>
                `;
            }
        } else {
            for (const [key, value] of Object.entries(resultados.taxasExibicao)) {
                ratesDisplay.innerHTML = `<p>${key}: <strong>${value}%</strong></p>`;
            }
        }

        primaTotalSpan.textContent = formatBRL(resultados.totalPrima);
        tradTotalSpan.textContent = formatBRL(resultados.totalTrad);
        economiaMesSpan.textContent = formatBRL(resultados.economiaMes);
        
        if (resultados.simType === 'mensal') {
            economiaMesLabel.textContent = "Por Mês";
            economiaAnoContainer.style.display = 'block';
            document.getElementById('economia-ano').textContent = formatBRL(resultados.economiaAno);
        } else {
            economiaMesLabel.textContent = "Nesta Venda";
            economiaAnoContainer.style.display = 'none';
        }

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});