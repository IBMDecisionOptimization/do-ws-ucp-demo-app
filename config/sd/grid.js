 // scenariogrid.addScenarioListWidget(onChangeScenario, 0, 0, 12, 4);
// scenariogrid.addScenarioChartWidget(onChangeScenario, 0, 0, 12, 6);



scenariogrid.addScenarioWidget(onChangeScenario, 0, 0, 2, 2);

scenariogrid.addKPIsWidget(2, 0, 10, 5);

scenariogrid.addSolveWidget(0, 2);


scenariogrid.addTableWidget('kpis', {}, 6, 5, 6, 3);

scenariogrid.addTablesWidget('Inputs', 'input', undefined, 0, 8, 6, 4);

scenariogrid.addTablesWidget('Outputs', 'output', undefined, 6, 8, 6, 4);
