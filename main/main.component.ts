import {Component, OnInit} from '@angular/core';
import {ApiService} from '../../services/api/api.service';
import {AppConfig} from '../../config/app.config';
import {SearchService} from '../../services/search-service/search-service.service';
import * as Highcharts from 'highcharts';
import {UtilsService} from '../../services/utils/utils.service';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
    public spinnerColor = 'red';
    public spinnerMode = 'indeterminate';
    public spinnerValue = 50;

    public spinnerObject = {
        name: '',
        showBlockSpinner: false,
        showTxSpinner: false,
        showPendingTxSpinner: false
    };
    public numberOfBlocks: number;
    public numberOfTransactions: number;
    public blocks: any[];
    public transactions: any[];
    public pendingTransactions: any[];
    public blocksChartsOptions: any;
    public transactionsChartsOptions: object;
    public pendingTransactionsChartsOptions: object;
    public blocksChart: any;
    public blocksChartData: any[];
    public transactionsChart: any;
    public pendingTransactionsChart: any;
    public transactionsChartData: any[];
    public xAxis: any[] = [];
    public pendingTransactionsChartData: any;
    public stats = {
        proBTC: '',
        proUSD: '',
        supply: '',
        lastBlock: 0,
        blockTime: '',
        difficulty: '',
        txCount: '',
        hashRate: '',
        previousBlock: 0
    };

    public searchString = '';
    public particlesStyle: object = {};
    public particlesParams: object = {
        interactivity: {
            events: {
                onclick: {
                    enable: false
                }
            }
        }
    };
    public particlesWidth = 100;
    public particlesHeight = 100;

    constructor(private apiService: ApiService, public searchService: SearchService, public utils: UtilsService) {
        this.blocksChartsOptions = {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Last 15'
            },
            subtitle: {
                text: 'Seconds needed to mine block'
            },
            tooltip: {
                style: {
                    fontSize: '20px'
                }
            },
            xAxis: {
                categories: []
            },
            yAxis: {
                title: {
                    text: 'Block Time'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: true
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Block Time',
                type: 'column',
                colorByPoint: true,
                showInLegend: false,
                data: [],
                dataLabels: {
                    enabled: true,
                    rotation: -90,
                    color: '#396688',
                    align: 'right',
                    y: -30,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            }]
        };

        this.transactionsChartsOptions = {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Number of Tx'
            },
            subtitle: {
                text: 'Last 15 transactions'
            },
            tooltip: {
                style: {
                    fontSize: '20px'
                }
            },
            xAxis: {
                categories: []
            },
            yAxis: {
                title: {
                    text: 'Number of Tx'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: true
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Tx Number',
                type: 'column',
                colorByPoint: true,
                showInLegend: false,
                data: [],
                dataLabels: {
                    enabled: true,
                    rotation: -90,
                    color: '#396688',
                    align: 'right',
                    y: -20,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            }]
        };

        this.pendingTransactionsChartsOptions = {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Last 15 Block Difficulties'
            },
            subtitle: {
                text: 'Difficulty of mined blocks'
            },
            legend: {
                enabled: false
            },
            tooltip: {
                style: {
                    fontSize: '20px'
                }
            },
            xAxis: {
                categories: []
            },
            yAxis: {
                title: {
                    text: 'Difficulty'
                },
                min: 5,
                max: 100
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: true
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Difficulty',
                type: 'column',
                colorByPoint: true,
                showInLegend: false,
                data: [],
                dataLabels: {
                    enabled: true,
                    rotation: -90,
                    color: '#396688',
                    align: 'right',
                    y: -30,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    },
                    formatter: function () {
                        return Highcharts.numberFormat(this.y, 2);
                    }
                }
            }]
        };

        this.getRecentBlocks(AppConfig.ranges.blocksNumber);

        this.getRecentTransactions(AppConfig.ranges.transactionsNumber);

        this.getPendingTransactions();

        /* setInterval(function () {
            if (this.stats.lastBlock > this.stats.previousBlock) {
                this.getRecentBlocks(AppConfig.ranges.blocksNumber);
            }
        }.bind(this), AppConfig.refreshTime.transactionRefreshTime);

        setInterval(function () {
            this.getRecentTransactions(AppConfig.ranges.transactionsNumber);
        }.bind(this), AppConfig.refreshTime.transactionRefreshTime);

        setInterval(function () {
            this.getPendingTransactions();
        }.bind(this), AppConfig.refreshTime.pendingTransactionsRefreshTime); */
    }

    ngOnInit() {
        this.getStats();
        setInterval(function () {
            this.getStats();
        }.bind(this), AppConfig.refreshTime.statsRefreshTime);
    }

    /**
     * Get statistics function
     */
    public getStats() {
        this.apiService.getStats()
            .then((result: any) => {
                if (result && result.length) {
                    this.stats.previousBlock = this.stats.lastBlock;
                    this.stats.proBTC = result[0].btcPrice;
                    this.stats.proUSD = result[0].usdPrice;
                    this.stats.supply = result[0].totalSupply;
                    this.stats.lastBlock = result[0].lastBlock;
                    this.stats.blockTime = result[0].blockTime;
                    this.stats.difficulty = this.utils.formatDifficultyValue(result[0].difficulty);
                    this.stats.txCount = result[0].txCount;
                    this.stats.hashRate = result[0].hashrate;
                }
            });
    }

    /**
     * Save block chart instance
     *
     * @param chartInstance
     */
    public saveBlockChartInstance(chartInstance) {
        this.blocksChart = chartInstance;
    }

    /**
     * Save transaction chart instance
     *
     * @param chartInstance
     */
    public saveTransactionChartInstance(chartInstance) {
        this.transactionsChart = chartInstance;
    }

    /**
     * Save pending transaction chart instance
     *
     * @param chartInstance
     */
    public savePendingTransactionChartInstance(chartInstance) {
        this.pendingTransactionsChart = chartInstance;
    }

    /**
     * Update series block data function
     *
     * @param xAxis
     * @param {Array<any>} data
     */
    public updateSeriesBlockData(xAxis, data: Array<any>) {
        if (this.blocksChart) {
            if (xAxis.length) {
                this.blocksChart.xAxis[0].categories = xAxis;
            }
            this.blocksChart.series[0].setData(data);
        }
    }

    /**
     * Update series transaction data function
     *
     * @param xAxis
     * @param {Array<any>} data
     */
    public updateSeriesTransactionData(xAxis, data: Array<any>) {
        if (this.transactionsChart) {
            if (xAxis.length) {
                this.transactionsChart.xAxis[0].categories = xAxis;
            }
            this.transactionsChart.series[0].setData(data);
        }
    }

    /**
     * Update series pending transaction data function
     *
     * @param xAxis
     * @param {Array<any>} data
     */
    public updateSeriesPendingTransactionData(xAxis, data: Array<any>) {
        if (this.pendingTransactionsChart) {
            if (xAxis.length) {
                this.pendingTransactionsChart.xAxis[0].categories = xAxis;
            }
            this.pendingTransactionsChart.series[0].setData(data);
        }
    }

    /**
     * Get recent blocks function
     *
     * @param numberOfBlocks
     */
    public getRecentBlocks(numberOfBlocks) {
        this.spinnerObject.name = 'blockSpinner';
        this.utils.toggleSpinnerDisplay(this.spinnerObject);
        this.apiService.getLatestBlocks(numberOfBlocks)
            .then(result => {
                if (result) {
                    this.spinnerObject.name = 'blockSpinner';
                    this.utils.toggleSpinnerDisplay(this.spinnerObject);
                    if (Object.keys(result).length > 1) {
                        this.blocks = [];
                        this.blocksChartData = [];
                        this.transactionsChartData = [];
                        this.pendingTransactionsChartData = [];
                        for (let i = 0; i < Object.keys(result).length; i++) {
                            this.blocks.push({
                                blockNumber: result[i].number,
                                miner: result[i].miner,
                                truncMiner: result[i].miner.slice(0, 4) + '...' + result[i].miner.slice(result[i].miner.length - 4, result[i].miner.length),
                                pool: result[i].extraDataDecode,
                                noOfTransactions: result[i].txCount,
                                time: this.utils.calculateDateTime(new Date(), new Date(result[i].timestamp * 1000))
                            });
                            let timeDifference = new Date(result[i].timestamp * 1000).getSeconds();
                            if (result[i + 1]) {
                                timeDifference = (new Date(result[i].timestamp * 1000).getTime() - new Date(result[i + 1].timestamp * 1000).getTime()) / 1000;
                            }
                            this.blocksChartData.push(timeDifference);
                            this.transactionsChartData.push(result[i].txCount);
                            this.pendingTransactionsChartData.push(parseFloat(this.utils.formatDifficultyValue(result[i].difficulty)));
                            this.xAxis.push('Block #: ' + result[i].number);
                        }
                    } else if (Object.keys(result).length == 1) {
                        if (result[0].number != this.blocks[0].blockNumber) {
                            this.blocks.unshift({
                                blockNumber: result[0].number,
                                miner: result[0].miner,
                                truncMiner: this.utils.formatAddress(result[0].miner),
                                pool: result[0].extraDataDecode,
                                noOfTransactions: result[0].txCount,
                                time: this.utils.calculateDateTime(new Date(), new Date(result[0].timestamp * 1000))
                            });
                            this.blocks.pop();
                            this.blocksChartData.unshift((new Date(result[0].timestamp * 1000).getTime()) / 1000);
                            this.blocksChartData.pop();
                            this.transactionsChartData.unshift(result[0].txCount);
                            this.transactionsChartData.pop();
                            this.pendingTransactionsChartData.unshift(parseFloat(this.utils.formatDifficultyValue(result[0].difficulty)));
                            this.pendingTransactionsChartData.pop();
                            this.xAxis.unshift('Block #: ' + result[0].number);
                            this.xAxis.pop();
                        }
                    }
                    this.updateSeriesBlockData(this.xAxis.reverse(), this.blocksChartData.reverse());
                    this.updateSeriesTransactionData(this.xAxis.reverse(), this.transactionsChartData.reverse());
                    this.updateSeriesPendingTransactionData(this.xAxis.reverse(), this.pendingTransactionsChartData.reverse());
                    this.numberOfBlocks = result[0].number;
                }
            })
            .catch(error => {
                console.log('Error', error);
                this.spinnerObject.name = 'blockSpinner';
                this.utils.toggleSpinnerDisplay(this.spinnerObject);
            });
    }

    /**
     * Get recent transactions function
     *
     * @param transactionsNumber
     */
    public getRecentTransactions(transactionsNumber) {
        this.spinnerObject.name = 'txSpinner';
        this.utils.toggleSpinnerDisplay(this.spinnerObject);
        this.apiService.getRecentTransactions(transactionsNumber)
            .then(result => {
                if (result) {
                    this.spinnerObject.name = 'txSpinner';
                    this.utils.toggleSpinnerDisplay(this.spinnerObject);
                    if (Object.keys(result).length > 1) {
                        this.transactions = [];
                        for (let i = 0; i < Object.keys(result).length; i++) {
                            this.transactions.push({
                                txHash: result[i].hash,
                                truncHash: this.utils.formatAddress(result[i].hash),
                                from: result[i].from,
                                truncFrom: this.utils.formatAddress(result[i].from),
                                to: result[i].to,
                                truncTo: this.utils.formatAddress(result[i].to),
                                amount: parseFloat(result[i].fromValue).toFixed(8)
                            });
                        }
                    } else if (Object.keys(result).length == 1) {
                        if (result[0].hash != this.transactions[0].hash &&
                            result[0].hash != this.transactions[this.transactions.length - 1].hash) {
                            this.transactions.unshift({
                                txHash: result[0].hash,
                                truncHash: this.utils.formatAddress(result[0].hash),
                                from: result[0].from,
                                truncFrom: this.utils.formatAddress(result[0].hash),
                                to: result[0].to,
                                truncTo: this.utils.formatAddress(result[0].hash),
                                amount: parseFloat(result[0].fromValue).toFixed(2)
                            });
                            this.transactions.pop();
                        }
                    }
                    if (this.blocks) {
                        this.apiService.getAllSingleBlockTransactions(this.blocks[0].blockNumber)
                            .then((result: any) => {
                                this.numberOfTransactions = result.length;
                            })
                            .catch(error => {
                                console.log('Error ', error);
                            });
                    }
                }
            })
            .catch(error => {
                console.log('Error', error);
                this.spinnerObject.name = 'txSpinner';
                this.utils.toggleSpinnerDisplay(this.spinnerObject);
            });
    }

    /**
     * Get pending transactions function
     */
    public getPendingTransactions() {
        this.spinnerObject.name = 'pendingTxSpinner';
        this.utils.toggleSpinnerDisplay(this.spinnerObject);
        this.apiService.getPendingTransactions()
            .then(result => {
                if (result) {
                    this.spinnerObject.name = 'pendingTxSpinner';
                    this.utils.toggleSpinnerDisplay(this.spinnerObject);
                    if (Object.keys(result).length > 1) {
                        this.pendingTransactions = [];
                        for (let i = 0; i < Object.keys(result).length; i++) {
                            this.pendingTransactions.push({
                                txHash: result[i].hash,
                                truncHash: this.utils.formatAddress(result[i].hash),
                                from: result[i].from,
                                truncFrom: this.utils.formatAddress(result[i].from),
                                to: result[i].to,
                                truncTo: this.utils.formatAddress(result[i].to),
                                amount: this.utils.calculateAmountFromWei(result[i].value),
                                gas: result[0].gas
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.log('Error: ', error);
                this.spinnerObject.name = 'pendingTxSpinner';
                this.utils.toggleSpinnerDisplay(this.spinnerObject);
            });
    }

    /**
     * Remove search input function
     */
    public removeSearch() {
        if (this.searchString) {
            this.searchString = '';
        }
    }
}
