'use strict';

var teacherApp = angular.module('physiclab.teacher',
        ['angular-popups','ngSanitize', 'igniteui-directives',
        'ui.calendar','angular-drag','ui.bootstrap','angularAwesomeSlider']);
teacherApp.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

     // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? $.param(data) : data;
    }];
});
teacherApp.controller('teacherCtrl',function($scope,$http, $compile,$timeout,uiCalendarConfig){
    $scope.page1 = 'all';
    $scope.page2 = '';
    $scope.editing_block = '';
    $scope.submitDialog = {'open':false,'reason':''};
    $scope.events = [];
    $scope.tag_types = [{key:'',value:""}];
    $scope.tag_reason = {'raw_data_content':'','objective_content':'',
        'principle_content':'','process_content':'','data_processing_content':'',
        'instrument_content':'','thinking_content':''};
    $scope.tag_grade = {};
    $scope.gradeSliderOption = {
        from: 1,
        to: 10,
        step: 1,
        dimension: "分",
        smooth:true,
        css: {
          background: {"background-color": "silver"},
          before: {"background-color": "#1abc9c"},
          default: {"background-color": "white"},
          after: {"background-color": "#f1c40f"},
          pointer: {"background-color": "#5bc0de"}
        },
        scale: [0, '|', 5, '|' , 10],
      };

    $scope.chart_type = 'scatterLine';
    $scope.chart_types = [{'key':'scatterLine','value':'散点直线图'},{'key':'scatter','value':'散点图'},
                          {'key':'scatterSpline','value':'散点曲线图'}]
    $scope.last_report = {};
    $scope.calendar_hidden = false;
    $scope.calculator_hidden = true;
    $scope.report_list_render = false;
    $scope.grade_editor_hidden = true;
    $scope.active_choice = [{"key":'false', 'value':'否'},{"key":'true', 'value':'是'},];
    $scope.objective={'editing':false, 'loaded':false};
    $scope.process={'editing':false, 'loaded':false};
    $scope.instrument={'editing':false, 'loaded':false};
    $scope.principle={'editing':false, 'loaded':false};
    $scope.data_processing={'editing':false, 'loaded':false};
    $scope.thinking={'editing':false, 'loaded':false};
    $scope.raw_data={'editing':false, 'loaded':false};
    $scope.experiments = {"loaded":false, 'content':[]};
    $scope.selected_experiment = {'loaded':false, 'content':{}};
    $scope.selected_report = {'loaded':false, 'content':{}};
    $scope.addTagDialog = {block: '',open:false, grade: 5, reason: '',reasons:{}, clear: function(block){this.grade=5;this.reason='';this.block=block;},
        add_tag:function(){
            if(this.block != ''){
                $scope.add_tag(this.block+'_content',this.grade, this.reason);
            }
        }};
    function removeElement(_element){
         var _parentElement = _element.parentNode;
         if(_parentElement){
                _parentElement.removeChild(_element);
         }
    }
    function countTrueValues(data) {
            var i, l = data.length, count = 0, elem;
            for (i = 0; i < l; i++) {
                elem = data[i];
                if (elem == 'true') {
                    count++;
                }
            }
            return count;
        }
    function countNotZeroValuesAvg(data) {
            var i, l = data.length, count = 0, elem,sum=0,avg;
            for (i = 0; i < l; i++) {
                elem = data[i];
                if (elem != 0) {
                    sum += elem;
                    count++;
                }
            }
            if(count != 0){
                avg = sum/count;
            }
            else{
                avg=0;
            }
            return avg;
        }
    function countNotZeroValuesAvgFromDict(data, key) {
            var i, l = data.length, count = 0, elem,sum=0,avg;
            for (i = 0; i < l; i++) {
                elem = data[i];
                if (elem[key] != 0) {
                    sum += elem[key];
                    count++;
                }
            }
            if(count != 0){
                avg = sum/count;
            }
            else{
                avg=0;
            }
            return avg;
        }
    function countFalseValues(data) {
            var i, l = data.length, count = 0, elem;
            for (i = 0; i < l; i++) {
                elem = data[i];
                if (elem == 'false') {
                    count++;
                }
            }
            return count;
        }
    $scope.countDictFromArray = function(ary,key,value){
        if(value){
            var count = 0;
            for(var i in ary){
                if(ary[i][key] == value)
                    count++;
            }
            return count;
        }
        else{
            var dic = {};
            var ele;
            for(var i in ary){
                ele = ary[i];
                if(ele[key] in dic)
                    dic[ele[key]]++;
                else{
                    dic[ele[key]]=1;
                }
            }
            return dic;
        }

    };
    $scope.deleteDictFromArray = function(ary,key,value){
         for(var i=0; i<ary.length;i++){
             if(ary[i][key] == value)
                 ary.splice(i,1);
         }
    };
    $scope.findDictFromArray = function(ary,key,value){
         for(var i=0; i<ary.length;i++){
             if(ary[i][key] == value)
                 return ary[i];
         }
    };
    $scope.filterFromArray = function(ary, keys, values){
        var ret = [];
        for(var i=0; i<ary.length;i++){
            var flag = true;
            for(var j=0; j<keys.length;j++){
                if(ary[i][keys[j]] != values[j]){
                    flag = false;
                    break;
                }
            }
            if(flag)
               ret.push(ary[i]);
        }
        return ret;
    };
    $scope.excludeFromArray = function(ary, keys, values){
        var ret = [];
        for(var i=0; i<ary.length;i++){
            var flag = true;
            for(var j=0; j<keys.length;j++){
                if(ary[i][keys[j]] == values[j]){
                    flag = false;
                    break;
                }
            }
            if(flag)
               ret.push(ary[i]);
        }
        return ret;
    };
    $scope.freshData = function(url, origin, success){
        $http.get(url,{})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 201:
                        $('#ajax-state').html("更新成功");
                        origin.content = response.data.content;
                        origin.loaded = true;
                        if(success)
                            success();
                        break;
                    default:
                        if(response.data.msg)
                            $('#ajax-state').html("更新失败:"+response.data.msg);
                        else
                            $('#ajax-state').html("更新失败");
                        break;
                }
            },
            function errorCallback(response){
                $('#ajax-state').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
            });
    };
    $scope.modifyData = function(url, data, origin, id, success){
        $http.post(url,data,{})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 201:
                        $('#ajax-state').html("修改成功");
                        if(origin){
                            origin.add(response.data.content);
                            if(typeof(id)=='string'){
                                $(id).igGrid("dataSourceObject", origin);
                                $(id).igGrid('dataBind');
                            }
                        }
                        if(typeof(id)=='function'){
                            id();
                        }
                        break;
                    default:
                        if(response.data.msg)
                            $('#ajax-state').html("修改失败:"+response.data.msg);
                        else
                            $('#ajax-state').html("修改失败");
                        break;
                }
            },
            function errorCallback(response){
                $('#ajax-state').html("服务器拒绝连接，请尝试刷新后再试");
            });
    };
    $scope.uploadImages = function(block, files){
        if ( $scope.selected_experiment.loaded && files && files.length) {
           for (var i = 0; i < files.length; i++) {
              Upload.upload({
                url: '/user/report/image',
                data: {file: files[i], 'rid': $scope.selected_experiment.rid},
                }).then(function (resp) {
                    if(resp.data.status == 201){
                        $("#"+block+"-image-upload-status").html("图片上传成功");
                        $scope.insert_image(block, resp.data.url);
                        $timeout(function(){
                            $("#"+block+"-image-upload-status").html("拖拽图片至此添加");
                        },5000);
                    }
                }, function (resp) {
                    $("#"+block+"-image-upload-status").html("图片上传失败:"+resp.status);
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $("#"+block+"-image-upload-status").html('上传进度: ' + progressPercentage + '% ');
                });
           }
      }
    };
    $scope.generateReportGrid = function(id, data){
        $("#" + id + "-grid").igGrid({
            primaryKey: "rid",
            width: '100%',
            columns: [
                    { headerText: "报告号", key: "rid", dataType: "string", width: "15%" },
                    { headerText: "姓名", key: "name", dataType: "string", width: "15%" },
                    { headerText: "学号", key: "username", dataType: "string", width: "15%" },
                    { headerText: "已提交", key: "is_submit", dataType: "string", width: "15%" },
                    { headerText: "已批改", key: "is_corrected", dataType: "string", width: "15%"},
                    { headerText: "总分", key: "total_grades", dataType: "numeric", width: "15%" },
                    { key: "jump", headerText: "查看", dataType: "string",unbound:true, width: "10%",
                                template:"<button class='btn btn-success btn-xs' onclick='changeReport(${rid})'>查看</button>"},
                ],
            autofitLastColumn: true,
            autoGenerateColumns: false,
            dataSource: data,
            showDoneCancelButtons: true,
            autoCommit: false,
            requestError: function(evt, ui) {console.log("request error")},
            features: [
                    {
						name: "Updating",
						enableAddRow: false,
						enableDeleteRow: false,
						editMode: "row",
                        editRowEnded: function(evt, ui){
                            if(!ui.rowAdding && ui.update){
                                $scope.modifyData('/user/report/modify', ui.values);
                            }
                        },
						columnSettings: [
							{
							    columnKey: "rid",
								editorType: 'text',
								required: true,
								validation: true,
							},
							{
							    columnKey: "name",
								editorType: 'text',
								readOnly: true,
								validation: true,
							},
							{
							    columnKey: "username",
								editorType: 'text',
								readOnly: true,
								validation: true,
							},
							{
							    columnKey: "total_grades",
								editorType: 'numeric',
								required: true,
								validation: true,
							},
							{
							    columnKey: "is_submit",
								readOnly: true,
								validation: true,
							},
							{
								columnKey: "is_corrected",
								editorType: 'combo',
								required: true,
								editorOptions: {
                                    dataSource: $scope.active_choice,
                                    valueKey: "key",
                                    textKey: "value",
                                    mode: "dropdown",
								},
								validation: true,
							},
						],
					},
                    {
                        name: "Sorting",
                        type: "local",
                    },
                    {
                        name: "Filtering",
                        type: "local",
                        mode: "advanced",
                        filterDialogContainment: "window"
                    },
                    {
                        name: "ColumnMoving",
                    },
                    {
                        name: 'Paging',
                        type: "local",
                        pageSize: 20,
                        pageSizeDropDownLocation : "inpager",
                    },
                    {
                        name: "Resizing"
                    },
                             {
                                name: "Summaries",
                                showDropDownButton: false,
                                showSummariesButton: false,
                                 columnSettings: [
                                      {
                                          columnKey: "rid",
                                          summaryOperands: [
                                              {
                                                  rowDisplayLabel: "数量",
                                                  type: "count",
                                                  decimalDisplay: 3
                                              }
                                          ]
                                      },
                                     {
                                         columnKey: "username",
                                         allowSummaries: false
                                     },
                                     {
                                          columnKey: "name",
                                          allowSummaries: false
                                     },
                                     {
                                         columnKey: "time",
                                     },
                                     {
                                columnKey: "is_corrected",
                                summaryOperands: [
                                    {
                                        rowDisplayLabel: "已批改",
                                        type: "custom1",
                                        summaryCalculator: $.proxy(countTrueValues, this),
                                        order: 1
                                    },
                                    {
                                        rowDisplayLabel: "未批改",
                                        type: "custom2",
                                        summaryCalculator: $.proxy(countFalseValues, this),
                                        order: 2
                                    }
                                ]
                                },

                                     {
                                columnKey: "total_grades",
                                summaryOperands: [
                                    {
                                        rowDisplayLabel: "非0平均分",
                                        type: "custom3",
                                        summaryCalculator: $.proxy(countNotZeroValuesAvg, this),
                                        order: 1
                                    },
                                    {
                                        rowDisplayLabel: "最低分",
                                        type: "Min",
                                        order: 2
                                    },
                                    {
                                        rowDisplayLabel: "最高分",
                                        type: "Max",
                                        order: 3
                                    }
                                ]
                                }

                                 ]
                             }
                ]
        });
    };
    $scope.generateDateGrid = function(id, data){
        $("#raw-grid-"+id).igGrid({
            width: '100%',
            columns: data.columns,
            autofitLastColumn: true,
            primaryKey:'key',
            autoGenerateColumns: false,
            dataSource: data.data2,
            showDoneCancelButtons: true,
            autoCommit: false,
            requestError: function(evt, ui) {console.log("request error")},
            features: [
                    {
                        name: "Resizing"
                    },
                    {
                        name: "Summaries",
                        columnSettings: data.summary,
                        showDropDownButton: false,
                        showSummariesButton: false,
                    }
                ]
        });
    };
    $scope.exportExcel = function(id){
        $.ig.GridExcelExporter.exportGrid($("#"+id), {
                            fileName: "Excel_"+id,
                            gridFeatureOptions: {
                                summaries: "none",
                                sorting: "none",
                                paging: "currentPage",
                                filtering: "none",
                            }
                        });
    };
    $scope.parseTable = function(table){
        var data = [];
        var data2 = [];
        var series = [];
        var columns = [];
        var summary = [];
        var typeX = 'numericX';
        var nameX = 'X轴';
        var typeY = 'numericY';
        var nameY = 'Y轴';
        var colName = [];
        var rowNames = [];
        $(table).find("tr").each(
            function(i){
                var rowName = '';
                var row = {};
                $(this).find('td').each(
                    function(j){
                        if(i==0&&j==0){
                            nameX = $(this).text();
                        }
                        else if(i==0){
                            var num = parseFloat($(this).text());
                            if(!isNaN(num)){
                                colName.push(num);
                            }
                            else{
                                colName.push($(this).text());
                                typeX = 'categoryX';
                            }
                        }
                        else if(j==0){
                            rowName=$(this).text();
                            rowNames.push(rowName);
                            row['key'] = i+":"+rowName;
                        }
                        else if(i==1){
                            var num = parseFloat($(this).text());
                            if(isNaN(num)){
                                num = 0;
                            }
                            var dic = {};
                            dic['X'] = colName[j-1];
                            dic[rowName] = num;
                            data.push(dic);
                            row[colName[j-1]] = num;
                        }
                        else{
                            var num = parseFloat($(this).text());
                            if(isNaN(num)){
                                num = 0;
                            }
                            data[j-1][rowName] = num;
                            row[colName[j-1]] = num;
                        }
                    });
                if(i!=0)
                    data2.push(row);
            }
        );
        for(var i=0;i<rowNames.length;i++){
            series.push({name:i+"-"+rowNames[i],type:$scope.chart_type,title:rowNames[i]+'',xAxis:'xAxis',yAxis:'yAxis',
                        yMemberPath:rowNames[i]+'',xMemberPath:'X', markerType: "circle",});
        }
        var summaryOperands=[{ "rowDisplayLabel": "Avg", "type": "AVG"}];
        var width = 100 / (colName.length + 1);
        var interval = 2;
        if(typeX=='numericX'){
            interval = Math.floor(Math.abs(colName[colName.length-1]-colName[0])/20);
        }
        columns.push({ 'headerText': nameX, 'key':'key', 'dataType': "string",'width':width+"%" });
        for(var i=0;i<colName.length;i++){
            columns.push({ 'headerText': colName[i], 'key': colName[i]+'', 'dataType': "numeric",'width':width+"%"});
            summary.push({'columnKey':colName[i]+'','allowSummaries':true,'summaryOperands':summaryOperands});
        }
        return {"rowNames":rowNames, 'data':data,'data2':data2 ,'typeX':typeX, 'nameX':nameX,'interval':interval,
                'typeY':typeY, 'nameY':nameY,'series':series,'columns':columns, 'summary':summary};
    };
    $scope.generateChart = function(id,data){
        $("#chart-"+id).igDataChart({
                width: "40%",
                height: "400px",
                legend: { element: "chart-legend-"+id },
                title: "由表"+(id+1)+"生成的图",
                dataSource: data.data,
                axes: [
                    {
                        name: "xAxis",
                        type: data.typeX,
                        title: data.nameX,
                        interval: data.interval,
                    },
                    {
                        name: "yAxis",
                        type: data.typeY,
                        title: data.nameY,
                    }
                ],
                series: data.series,
                isTransitionInEnabled:true,
                isHighlightingEnabled:true,
                horizontalZoomable: true,
                verticalZoomable: true,
                windowResponse: "immediate"
            });
    };
    $scope.autoCalculate = function(){
        $("#chart-block").html("");
        $scope.calculator_hidden = false;
        var tables = $("#raw_data_content").find("table");
        for(var i=0;i<tables.length;i++){
            var data = $scope.parseTable(tables[i]);
            var divC1 = $("<div></div>");
            var divC2 = $("<div></div>");
            var divR1 = $("<div></div>");
            var divR2 = $("<div></div>");
            divC1.attr("id","chart-"+i);
            divC2.attr("id","chart-legend-"+i);
            divR1.attr("id","raw-grid-"+i);
            divC1.attr("class","col-md-9");
            divC2.attr("class","col-md-3");
            divC2.attr("style","margin-top:40px;");
            divR1.attr("class","row");
            divR2.attr("class","row");
            divC1.appendTo(divR2);
            divC2.appendTo(divR2);
            divR1.appendTo($("#chart-block"));
            divR2.appendTo($("#chart-block"));
            $scope.generateChart(i,data);
            $scope.generateDateGrid(i,data);
        }
    };
    $scope.generateGradeChat = function(id){
        if(!$scope.selected_experiment.loaded)
            return 0;
        var data2 = $scope.countDictFromArray($scope.selected_experiment.content.reports, 'total_grades');
        var data3 = [];
        for(var i in data2){
            data3.push({'total_grades':i,'count': data2[i]});
        }
        var series = [{name:'成绩',type:'scatterLine',title:'成绩',xAxis:'xAxis',yAxis:'yAxis',
                        yMemberPath:'count',xMemberPath:'total_grades', markerType: "circle",}];
        $("#"+id).igDataChart({
                width: "100%",
                height: "200px",
                title: "非o平均分="+countNotZeroValuesAvgFromDict($scope.selected_experiment.content.reports,'total_grades'),
                dataSource: data3,
                axes: [
                    {
                        name: "xAxis",
                        type: 'numericX',
                        title: '分数',
                        maximumValue: 100,
                        minimumValue:0,
                        interval: 20,
                    },
                    {
                        name: "yAxis",
                        type: 'numericY',
                        title: '人数',
                        maximumValue: $scope.selected_experiment.content.reports.length,
                        minimumValue:0,
                        interval: 1,
                    }
                ],
                series: series,
                isTransitionInEnabled:true,
                isHighlightingEnabled:true,
                horizontalZoomable: true,
                verticalZoomable: true,
                windowResponse: "immediate"
            });
    };
    $scope.render_experiment = function(){
        $scope.page1 = 'experiment';
        var closed = $scope.countDictFromArray($scope.selected_experiment.content.reports, 'closed', true);
        if(closed == 0){
            var data = [{'key':'总报告数','value':$scope.selected_experiment.content.reports.length},]
        }
        else{
            var is_corrected = $scope.countDictFromArray($scope.selected_experiment.content.reports, 'is_corrected', true);
            var submit = closed - is_corrected;
            var data = [{'key':'已批改','value':is_corrected},{'key':'待批改','value':submit},]
        }
        $('#report_state_chart').igDoughnutChart({
            width: "100%",
            height: "200px",
            series:
                [{
                    name: "实验报告状态",
                    labelMemberPath: "key",
                    valueMemberPath: "value",
                    dataSource: data,
                    labelsPosition: "bestFit",
                    formatLabel: function (context) {
                        return context.itemLabel + " (" + context.item.value + ")";
                    }
                }]
        });
        $scope.generateGradeChat("chart-report-grade");
        if(!$scope.report_list_render){
            $scope.generateReportGrid('report', $scope.selected_experiment.content.reports);
            $scope.report_list_render = true;
        }
        else{
            $("#report-grid").igGrid("dataSourceObject", $scope.selected_experiment.content.reports);
            $("#report-grid").igGrid("dataBind");
        }
    };
    $scope.submitGrade = function(){
        $scope.modifyData('/user/report/modify', {'rid':$scope.selected_report.rid,
                                                  'grade':$("#report_grade").igNumericEditor('value')});
        $scope.selected_report.total_grades = $("#report_grade").igNumericEditor('value');
        $scope.grade_editor_hidden = true;
        $scope.generateGradeChat("chart2-report-grade");
    };

    $scope.render_tags = function(){
        var olds = $(".tooltip");
        for(var i=0;i<olds.length;i++){
            removeElement(olds[i]);
        }
        var total_grades = 100;
        for(var i in $scope.selected_report.content.tags){
            var tag = $scope.selected_report.content.tags[i];
            var html = '<div class="drag tooltip right in" tag-id="'+tag.tid
                +'" drag onmouseup="move_tag(this)" style="'+tag.html
                +'"><div class="tooltip-arrow"></div><div class="tooltip-inner"><div>扣'+
                    tag.grade+'分</div><div>'+tag.reason+'</div></div></div>"';
            var content = $compile(html)($scope);
            $("#"+tag.block).append(content);
            total_grades -= tag.grade;
        }
        $scope.selected_report.total_grades = total_grades;
        $("#report_grade").igNumericEditor('value',$scope.selected_report.total_grades);
        $scope.submitGrade();
    };
    $scope.add_tag = function(block, grade, reason){
        var parent = $("#"+block);
        if(grade)
            var _grade = grade;

        if(reason){
            if('object'==typeof(reason))
                var _reason = reason[0];
            else
                var _reason = reason;
        }
            if($scope.countDictFromArray($scope.tag_types,'key',_reason) == 0){
                $scope.tag_types.push({"key":_reason,"value":_reason});
                $(".tag_combo").igCombo("dataBind");
            }
               $scope.modifyData('/user/report/tag', {'rid':$scope.selected_report.rid,
                                               'grade':_grade,
                                               'reason':_reason,
                                               'html':'',
                                               'block':block,
                                               },
               $scope.selected_report.content.tags,$scope.render_tags);
    };
    $scope.move_tag = function(tid, style){
        var tag = $scope.findDictFromArray($scope.selected_report.content.tags,'tid',tid);
        tag.html = style;
        $scope.modifyData('/user/report/tag', {'tid':tid,'html':style,});
    };
    $scope.delete_tag = function(tid){
        $scope.modifyData('/user/report/tag', {'tid':tid});
        $scope.deleteDictFromArray($scope.selected_report.content.tags, 'tid', tid);
        $scope.render_tags();
    };
    $scope.render_report = function(){
        $scope.page1 = 'report';
        var blocks = ['objective', 'process', 'instrument', 'principle','data_processing', 'thinking', 'raw_data'];
        for(var i in blocks){
            $("#"+blocks[i]+"_content").html($scope.selected_report.content[blocks[i]]);
        }
        $("#student-head-img").attr('src',$scope.selected_report.content.student_photo);
        $("#report_grade").igNumericEditor({
            spinDelta: 1,
            dataMode: 'int',
            height: 150,
            width:"100%",
            value: $scope.selected_report.total_grades,
            minValue: -1,
            maxValue: 101,
            textAlign: "center",
            valueChanged: $scope.submitGrade,
        });
        $scope.generateGradeChat("chart2-report-grade");
        $scope.render_tags();
    };
    $scope.correct = function(){
        if($scope.selected_report.is_corrected)
            $scope.submitGrade();
        $scope.selected_report.is_corrected = true;
        if(!$scope.experiments.loaded){
            $scope.freshData('/experiment/all',$scope.experiments);
        }
        if(!$scope.selected_experiment.eid){
        // TODO: 未选择当前实验,应做提醒
            console.log($scope.selected_experiment);
        }
        else{
            if(!$scope.selected_experiment.loaded){
                $scope.freshData('/experiment/all?eid='+$scope.selected_experiment.eid,$scope.selected_experiment);
            }
            var prev = $scope.selected_report;
            //var to_select = $scope.findDictFromArray($scope.selected_experiment.content.reports, 'is_corrected', false);

            var to_select = $scope.filterFromArray($scope.selected_experiment.content.reports,
                    ['is_corrected','is_submit'],[false,true]);
            if(to_select.length > 0){
                $scope.selected_report = to_select[0];
                if(prev.rid){
                    $scope.selected_report.prev = prev;
                    prev.next = $scope.selected_report;
                }
                else{
                    $scope.selected_report.prev = $scope.selected_report;
                }
                $scope.freshData('/user/report?rid='+$scope.selected_report.rid, $scope.selected_report, $scope.render_report);
            }
            else{
                // TODO: 提醒已经批改完成
                $("#get_next_span").html("没有更多了");
            }
        }
    };
    $scope.changeReport = function(rid){
        if(!$scope.experiments.loaded){
            $scope.freshData('/experiment/all',$scope.experiments);
        }
        if(!$scope.selected_experiment.eid){
        // TODO: 未选择当前实验,应做提醒
            console.log($scope.selected_experiment);
        }
        else{
            if(!$scope.selected_experiment.loaded){
                $scope.freshData('/experiment/all?eid='+$scope.selected_experiment.eid,$scope.selected_experiment);
            }
            var to_select = $scope.findDictFromArray($scope.selected_experiment.content.reports, 'rid', rid);
            if(to_select){
                $scope.selected_report = to_select;
                $scope.freshData('/user/report?rid='+rid, $scope.selected_report, $scope.render_report);
            }
        }
    };
    $scope.changeExperiment = function(eid){
        if(!$scope.experiments.loaded){
            $scope.freshData('/experiment/all',$scope.experiments);
        }
        $scope.selected_experiment = $scope.findDictFromArray($scope.experiments.content, 'eid', eid);
        if($scope.selected_experiment){
            $scope.freshData('/experiment/all?eid='+eid, $scope.selected_experiment, $scope.render_experiment);
            $scope.selected_report = {'loaded':false, 'content':{}};
            $("#get_next_span").html("批改下一份");
        }
    };
    $scope.render_all = function(){
        $scope.page1 = 'all';
        $scope.events.splice(0, $scope.events.length);
        for(var i=0;i< $scope.experiments.content.length;i++){
            var _class;
            if($scope.experiments.content[i].base.is_active){
                if($scope.experiments.content[i].closed){
                    _class = "event-success";
                }
                else{
                    _class = "event-warning";
                }
            }
            else{
                _class = "event-danger";
            }
            $scope.events.push({title:"实验名:"+$scope.experiments.content[i].base.name+"-----教室:"+$scope.experiments.content[i].classroom,
                               start:new Date($scope.experiments.content[i].date),
                                end:new Date($scope.experiments.content[i].end_date),
                                eid:$scope.experiments.content[i].eid,
                                allDay:true,
                                className:_class,
                                stick: true,
                                });
        }
    };
    $scope.changeAll = function(){
        $scope.freshData('/experiment/all',$scope.experiments,$scope.render_all);
    };

    $scope.closeCalculator = function(){
        $scope.calculator_hidden = true;
        $("#chart-block").html("");
    };
    $scope.showHideCalendar = function(){
        if($scope.calendar_hidden){
            $scope.calendar_hidden = false;
        }
        else{
            $scope.calendar_hidden = true;
        }
    };
    $scope.showGradeEditor = function(){
        if($scope.grade_editor_hidden){
            $scope.grade_editor_hidden = false;
            $("#report_grade").igNumericEditor("setFocus", 200);
        }
        else{
            $scope.grade_editor_hidden = true;
        }
    };
    $scope.toggleBlock = function(block){
        if(block){
            block = false;
        }
        else{
            block = true;
        }
    };
    $scope.push_back = function(){
        $scope.selected_report.is_submit = false;
        $scope.submitDialog.open = false;
        $scope.modifyData('/user/push-back',{'rid':$scope.selected_report.rid,'reason':$scope.submitDialog.reason});
        //$scope.correct();
    };
    $scope.alertOnEventClick = function(date, jsEvent, view){
        $scope.changeExperiment(date.eid);
    };
    $scope.alertOnEventRender = function( event, element, view ) {
        element.attr({'tooltip': event.title,
                     'tooltip-append-to-body': true});
        element.attr({'class': event.className+" fc-day-grid-event fc-event fc-start fc-end fc-draggable"});
        $compile(element)($scope);
    };
    /* config object */
    $scope.uiConfig = {
      calendar:{
        height: 450,
        editable: true,
        dayNames: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        dayNamesShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        monthNames: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月',],
        header:{
          left: 'title',
          center: '',
          right: 'today prev,next'
        },
        eventClick: $scope.alertOnEventClick,
        eventRender: $scope.alertOnEventRender,
      }
    };

    $scope.eventSources = [$scope.events];
    $scope.changeAll();
});