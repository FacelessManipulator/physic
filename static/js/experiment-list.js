'use strict';

var experimentListApp = angular.module('physiclab.experimentList',
        ['angular-popups','physiclab.directives','ngSanitize', 'igniteui-directives','ngFileUpload','ui.calendar','ui.bootstrap' ]);
experimentListApp.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

     // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? $.param(data) : data;
    }];
});
experimentListApp.controller('experimentCtrl',function($scope,$http, $compile,Upload,$timeout,uiCalendarConfig){
    $scope.page1 = 'all';
    $scope.page2 = '';
    $scope.editing_block = '';
    $scope.events = [];
    $scope.submitDialog = false;
    $scope.calendar_hidden = false;
    $scope.objective={'editing':false, 'loaded':false};
    $scope.process={'editing':false, 'loaded':false};
    $scope.instrument={'editing':false, 'loaded':false};
    $scope.principle={'editing':false, 'loaded':false};
    $scope.data_processing={'editing':false, 'loaded':false};
    $scope.thinking={'editing':false, 'loaded':false};
    $scope.raw_data={'editing':false, 'loaded':false};
    $scope.reports = {"loaded":false};
    $scope.selected_report = {'loaded':false, 'content':{}};
    $scope.experiment = {'name':'experiment', 'loaded':false, 'url':'experiment/base/all','content':[]};
    $scope.addExperimentDialog = {open:false};
    $scope.drag_hide = {data_processing: true, instrument: true,thinking: true,process: true,
            principle: true,objective: true}
    $scope.deleteDialog = {};
    $scope.mathDialog = {open:false};
    function removeElement(_element){
         var _parentElement = _element.parentNode;
         if(_parentElement){
                _parentElement.removeChild(_element);
         }
    }
    $scope.countDictFromArray = function(ary,key,value){
        var count = 0;
        for(var i in ary){
            if(ary[i][key] == value)
                count++;
        }
        return count;
    };
    $scope.findDictFromArray = function(ary,key,value){
         for(var i in ary){
             if(ary[i][key] == value)
                 return ary[i];
         }
    };
    $scope.grab_unique = function(ary, key){
        var ret = [];
        var dup = {};
        for(var i in ary){
             if(dup[ary[i][key]] != 1){
                dup[ary[i][key]] = 1;
                ret.push(ary[i]);
             }
         }
         return ret;
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
    $scope.freshData = function(url, origin, success){
        $http.get(url,{})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 401:
                        $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>用户名或密码错误");
                        break;
                    case 402:
                        $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign '></i>用户尚未激活");
                        break;
                    case 403:
                        $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>验证码错误");
                        break;
                    case 201:
                        $('#success').html("<i style='color:green;margin-right:15px;' class='icon-ok '></i>登陆完成，正在跳转...");
                        origin.content = response.data.content;
                        if(success)
                            success();
                        break;
                }
            },
            function errorCallback(response){
                $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
            });
    };
    $scope.modifyData = function(url, data, origin, id, success){
        $http.post(url,data,{})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 401:
                        $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>用户名或密码错误");
                        break;
                    case 201:
                        if(success)
                            success();
                        else{
                            $('#success').html("<i style='color:green;margin-right:15px;' class='icon-ok '></i>登陆完成，正在跳转...");
                            if(origin){
                                origin.add(response.data.content);
                                if(id){
                                    $(id).igGrid("dataSourceObject", origin);
                                    $(id).igGrid('dataBind');
                                }
                            }
                        }
                        break;
                }
            },
            function errorCallback(response){
                $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
            });
    };

    $scope.generateReportGrid = function(id, data){
        $("#" + id + "-grid").igGrid({
            primaryKey: "rid",
            width: '100%',
            columns: [
                    { headerText: "报告号", key: "rid", dataType: "string", width: "15%" },
                    { headerText: "报告人", key: "name", dataType: "string", width: "15%" },
                    { headerText: "实验名", key: "experiment_name", dataType: "string", width: "30%"},
                    { headerText: "批改", key: "is_corrected", dataType: "string", width: "15%" },
                    { headerText: "成绩", key: "total_grades", dataType: "numeric", width: "15%" },
                    { key: "jump", headerText: "查看", dataType: "string",unbound:true, width: "10%",
                      template:"<button class='btn btn-success btn-xs' onclick='changeToReport(${rid})'>查看</button>" }
                ],
            autofitLastColumn: true,
            autoGenerateColumns: false,
            dataSource: data,
            showDoneCancelButtons: false,
            autoCommit: false,
            features: [
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
                        pageSize: 10,
                        pageSizeDropDownLocation : "inpager",
                    },
                    {
                        name: "Resizing"
                    },
                ]
        });
    };
    $scope.generateHtmlEditor = function(block, data){
        $("#"+block+"_editor").igHtmlEditor({
            height:"500px",
            width:"99%",
            value:data,
            showCopyPasteToolbar: false,
            paste: function(evt, ui){
                $("#ajax-state").text("粘贴禁止");

                $timeout(function(){
                    $("#"+ui.owner.element.attr("id")).igHtmlEditor("executeAction", "undo");
                },100);
            },
            rendered: function (evt, ui) {
                $('<link href="/static/mathquill-0.9.1/mathquill.css" rel="stylesheet" type="text/css" />').appendTo($(ui.owner.workspace).contents().find("head"));
                $(ui.owner.workspace).contents().find("body").attr("style","padding-bottom:200px;");
                mathDialogInit('math-dialog');
                $(ui.owner.workspace).contents().find("body").on({
                    "dragenter": $scope.handleDragEnter,
                    "dragleave": $scope.handleDragLeave
                });
            },
            customToolbars: [
                {
                    name: "Mathquill",
                    collapseButtonIcon: "ui-igbutton-collapse",
                    expandButtonIcon: "ui-igbutton-expand",
                    items: [{
                        name: "appendSignature",
                        type: "button",
                        handler: $scope.open_math_dialog,
                        scope: this,
                        props: {
                            isImage: {
                                value: false,
                                action: '_isSelectedAction'
                            },
                            imageButtonTooltip: {
                                value: "打开公式编辑器",
                                action: '_tooltipAction'
                            },
                            imageButtonIcon: {
                                value: "ui-sigma",
                                action: '_buttonIconAction'
                            }
                        }
                    }]
                }
            ]
        });
        $timeout(function(){
            $("#"+block+"_editor").igHtmlEditor("resizeWorkspace");
        },100);
    };
    $scope.generateDateEditor = function(block, data){
        $("#"+block+"_editor").igHtmlEditor({
            height:"500px",
            width:"99%",
            value:data,
            showCopyPasteToolbar: false,
            paste: function(evt, ui){
                 $("#ajax-state").text("粘贴禁止！");

                $timeout(function(){
                    $("#"+ui.owner.element.attr("id")).igHtmlEditor("executeAction", "undo");
                },100);
            },
            rendered: function (evt, ui) {
                $('<link href="/static/mathquill-0.9.1/mathquill.css" rel="stylesheet" type="text/css" />').appendTo($(ui.owner.workspace).contents().find("head"));
                $(ui.owner.workspace).contents().find("body").attr("style","padding-bottom:200px;");
                mathDialogInit('math-dialog');
                $(ui.owner.workspace).contents().find("body").on({
                    "dragenter": $scope.handleDragEnter,
                    "dragleave": $scope.handleDragLeave
                });
            },
            showCopyPasteToolbar: false,
            showFormattingToolbar: false,
            showTextToolbar: false,
        });
        $timeout(function(){
            $("#"+block+"_editor").igHtmlEditor("resizeWorkspace");
        },100);
    };
    $scope.editor_edit = function(block){
        if(!$scope[block].loaded){
            $scope.generateHtmlEditor(block, $scope.selected_report.content[block]);
            $scope[block].loaded = true;
        }
        else{
            $("#" +block+ "_editor").igHtmlEditor("setContent", $scope.selected_report.content[block],'html');
            $timeout(function(){
                $("#"+block+"_editor").igHtmlEditor("resizeWorkspace");
            },100);
        }
        $scope.editing_block = block;
    };
    $scope.raw_data_editor_edit = function(block){
        if(!$scope[block].loaded){
            $scope.generateDateEditor(block, $scope.selected_report.content[block]);
            $scope[block].loaded = true;
        }
        else{
            $("#" +block+ "_editor").igHtmlEditor("setContent", $scope.selected_report.content[block],'html');
            $timeout(function(){
                $("#"+block+"_editor").igHtmlEditor("resizeWorkspace");
            },100);
        }
        $scope.editing_block = block;
    };
    $scope.editor_save = function(block){
        $scope.selected_report.content[block] = $("#" +block+ "_editor").igHtmlEditor("getContent", "html");
        $("#"+block+"_content").html($scope.selected_report.content[block]);
        $scope.modifyData('/user/report/modify',{'block':block,'rid':$scope.selected_report.rid , 'content': $scope.selected_report.content[block]});
        $scope.editing_block = '';
    };
    $scope.editor_cancel = function(block){
        $("#" +block+ "_editor").igHtmlEditor("setContent", $scope.selected_report.content[block],'html');
        $scope.editing_block = '';
    };
    $scope.open_math_dialog = function(ui){
    //强制刷新，否则dialog出不来

		$("#dialog-editor").mathquill('revert');
		$("#dialog-editor").html("").mathquill('editable').mathquill('write', "");
        $scope.$apply(function(){$scope.mathDialog.open = true});
    };
    $scope.uploadImages = function(block, files){
        if ( $scope.selected_report.loaded && files && files.length) {
           for (var i = 0; i < files.length; i++) {
              Upload.upload({
                url: '/user/report/image',
                data: {file: files[i], 'rid': $scope.selected_report.rid},
                }).then(function (resp) {
                    if(resp.data.status == 201){
                        $("#"+block+"-image-upload-status").html("图片上传成功");
                        $scope.insert_image(block, resp.data.url);
                        $timeout(function(){
                            $("#"+$scope.editing_block+"-dropZone").remove();
                        },5000);
                    }
                    else{
                        $("#"+block+"-file-upload-status").html("文件上传失败");
                        $timeout(function(){
                            $("#"+$scope.editing_block+"-dropZone").remove();
                        },5000);
                    }
                }, function (resp) {
                    $("#"+block+"-image-upload-status").html("图片上传失败:"+resp.status);
                    $("#"+$scope.editing_block+"-dropZone").remove();
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $("#"+block+"-image-upload-status").html('上传进度: ' + progressPercentage + '% ');
                    $("#"+$scope.editing_block+"-dropZone").remove();
                });
           }
      }
    };
    $scope.uploadFiles = function(block, files){
        if ( $scope.selected_report.loaded && files && files.length) {
           for (var i = 0; i < files.length; i++) {
              Upload.upload({
                url: '/user/report/file',
                data: {file: files[i], 'rid': $scope.selected_report.rid},
                }).then(function (resp) {
                    if(resp.data.status == 201){
                        $("#"+block+"-file-upload-status").html("文件上传成功");
                        $scope.selected_report.content.attach_files.push(resp.data.content);
                        $timeout(function(){
                            $("#"+block+"-file-upload-status").html("拖拽文件至此添加");
                        },5000);
                    }
                    else{
                        $("#"+block+"-file-upload-status").html("文件上传失败");
                        $timeout(function(){
                            $("#"+block+"-file-upload-status").html("拖拽文件至此添加");
                        },5000);
                    }
                }, function (resp) {
                    $("#"+block+"-file-upload-status").html("文件上传失败:"+resp.status);
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $("#"+block+"-file-upload-status").html('上传进度: ' + progressPercentage + '% ');
                });
           }
      }
    };
    $scope.insert_image = function(block, url){
        var span = document.createElement('span'),editorContent = $("#"+block+"_editor").igHtmlEditor("getContent", "html");
        span.innerHTML = ['<img style="border: 1px solid #000;margin: 10px 5px 0 0;max-width: 100%;" src="',url,'" />'].join('');
        try{
            $("#"+block+"_editor").igHtmlEditor("insertAtCaret", $(span).html());
        }
        catch(e){
            $("#"+block+"_editor").igHtmlEditor("setContent", editorContent + $(span).html(), "html");
        }

    };
    $scope.render_tags = function(){
        var olds = $(".tooltip");
        for(var i=0;i<olds.length;i++){
            removeElement(olds[i]);
        }
        for(var i in $scope.selected_report.content.tags){
            var tag = $scope.selected_report.content.tags[i];
            var html = '<div class="drag tooltip right in" style="'+tag.html
                +'"><div class="tooltip-arrow"></div><div class="tooltip-inner"><div>扣'+
                    tag.grade+'分</div><div>'+tag.reason+'</div></div></div>"';
            var content = $compile(html)($scope);
            $("#"+tag.block).append(content);
        }
    };
    $scope.render_report = function(){
        $scope.page1 = 'report';
        var blocks = ['objective', 'process', 'instrument', 'principle','data_processing', 'thinking', 'raw_data'];
        for(var i in blocks){
            $("#"+blocks[i]+"_content").html($scope.selected_report.content[blocks[i]]);
        }
        $("#teacher-head-img").attr('src',$scope.selected_report.content.teacher_photo);
        if($scope.selected_report.closed&&$scope.selected_report.is_submit&&$scope.selected_report.is_corrected)
            $scope.render_tags();
    };
    $scope.changeReport = function(rid){
        if(!$scope.reports.loaded){
            $scope.freshData('/user/report',$scope.reports);
            $scope.reports.loaded = true;
        }
        $scope.selected_report = $scope.findDictFromArray($scope.reports.content, 'rid', rid);
        if($scope.selected_report){
            $scope.selected_report.loaded = true;
            $scope.freshData('/user/report?rid='+rid, $scope.selected_report, $scope.render_report);
        }
    };
    $scope.render_grades = function(){
        $scope.page1 = 'grades';
        $scope.reports.loaded = true;
        $scope.generateReportGrid('grades',$scope.reports.content);
    }
    $scope.changeGrades = function(){
        $scope.freshData('/user/report',$scope.reports, $scope.render_grades);
    }
    $scope.render_all = function(){
        $scope.page1 = 'all';
        $scope.reports.loaded = true;
        var closed = $scope.countDictFromArray($scope.reports.content, 'closed', true);
        var is_corrected = $scope.countDictFromArray($scope.reports.content, 'is_corrected', true);
        var all = $scope.reports.content.length;
        var submit = all - is_corrected - closed;
        var data = [{'key':'已关闭','value':closed},{'key':'已出分','value':is_corrected},{'key':'可提交','value':submit},]
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
        $scope.events.splice(0, $scope.events.length);
        for(var i=0;i< $scope.reports.content.length;i++){
            var _class = "";
            var report = $scope.reports.content[i];
            if(report.closed&&!report.is_submit){
                _class = "event-danger";
            }
            else if(!report.is_submit){
                _class= "event-warning";
            }
            else if(report.is_submit&&!report.is_corrected){
                _class= "event-success";
            }
            else{
                _class= "event-info";
            }
            $scope.events.push({title:"实验名:"+$scope.reports.content[i].experiment.base.name+"/教室:"+$scope.reports.content[i].experiment.classroom,
                               start:new Date($scope.reports.content[i].experiment.date),
                                end:new Date($scope.reports.content[i].experiment.end_date),
                                rid:$scope.reports.content[i].rid,
                                allDay:true,
                                stick: true,
                                className: _class
                                });
        }
    };
    $scope.changeAll = function(){
        $scope.freshData('/user/report',$scope.reports, $scope.render_all);
    };
    $scope.math_output = function(){
        var children = $("#math-dialog-editor").children();
        var content = "";
        for(var i =1;i<children.length;i++){
            content = content+children[i].outerHTML;
        }
        if($scope.editing_block != ''){
            var span = document.createElement('span'),editorContent = $("#"+$scope.editing_block+"_editor").igHtmlEditor("getContent", "html");
            span.innerHTML = ['<span style="padding: 2px;border:0px;" class="mathquill-rendered-math">',content,'</span><span>&nbsp</span>'].join('');
            try{
                $("#"+$scope.editing_block+"_editor").igHtmlEditor("insertAtCaret", $(span).html());
            }
            catch(e){
                $("#"+$scope.editing_block+"_editor").igHtmlEditor("setContent", editorContent + $(span).html(), "html");
            }
        }
    };

    $scope.showHideCalendar = function(){
        if($scope.calendar_hidden){
            $scope.calendar_hidden = false;
        }
        else{
            $scope.calendar_hidden = true;
        }
    }
    $scope.alertOnEventClick = function(date, jsEvent, view){
        $scope.changeReport(date.rid);
    };
    $scope.alertOnEventRender = function( event, element, view ) {
        element.attr({'tooltip': event.title,
                     'tooltip-append-to-body': true});
        element.attr({'class': event.className+" fc-day-grid-event fc-event fc-start fc-end fc-draggable"});
        $compile(element)($scope);
    };
    $scope.submit = function(){
        $scope.modifyData('/user/submit',{'rid':$scope.selected_report.rid});
        $scope.submitDialog = false;
        $scope.selected_report.is_submit = true;
        $scope.changeReport($scope.selected_report.rid);
    };

    $scope.changeExperiment = function(event, ui){
        $scope.addExperimentDialog.teacher_set = $scope.filterFromArray($scope.experiment.content,['b_title'],[ui.items[0].data.b_title]);

        $("#teacher-combo").igCombo('option', 'dataSource', $scope.grab_unique($scope.addExperimentDialog.teacher_set,'teacher_name'));
        $("#teacher-combo").igCombo('dataBind');

        if($scope.addExperimentDialog.teacher_set.length>0){
            $scope.addExperimentDialog.time_set = $scope.filterFromArray($scope.addExperimentDialog.teacher_set ,
                ['teacher_name'],[$scope.addExperimentDialog.teacher_set[0].teacher_name]);
            $("#time-combo").igCombo('option', 'dataSource',$scope.addExperimentDialog.time_set);
            $("#time-combo").igCombo('dataBind');
        }
    };
    $scope.changeTeacher = function(event, ui){
        $scope.addExperimentDialog.time_set = $scope.filterFromArray($scope.addExperimentDialog.teacher_set , ['teacher_name'],[ui.items[0].data.teacher_name]);
        $("#time-combo").igCombo('option', 'dataSource', $scope.addExperimentDialog.time_set);
        $("#time-combo").igCombo('dataBind');
    };
    $scope.changeTime = function(event, ui){
        $scope.addExperimentDialog.eid = ui.items[0].data.eid;
    };
    $scope.renderAddDialog = function(){
             $scope.addExperimentDialog.eid = $scope.experiment.content[0].eid;
            $scope.addExperimentDialog.teacher_set = $scope.filterFromArray($scope.experiment.content,['b_title'],[$scope.experiment.content[0].b_title]);
            $scope.addExperimentDialog.time_set = $scope.filterFromArray($scope.addExperimentDialog.teacher_set,
                ['teacher_name'],[$scope.addExperimentDialog.teacher_set[0].teacher_name]);

            $("#exp-combo").igCombo({
                mode:"dropdown",
                dataSource: $scope.grab_unique($scope.experiment.content,'b_title'),
                valueKeyType:"string",
                valueKey:"b_title",
                textKeyType:"string",
                textKey:"name",
                enableClearButton:false,
                selectionChanged: $scope.changeExperiment,
                //initialSelectedItems : [
                //  { value: $scope.selected_institute.b_title },
                //],
                width: "100%"
            });
            $("#teacher-combo").igCombo({
                mode:"dropdown",
                dataSource: $scope.grab_unique($scope.addExperimentDialog.teacher_set),
                valueKeyType:"string",
                valueKey:"teacher_name",
                textKeyType:"string",
                textKey:"teacher_name",
                enableClearButton:false,
                selectionChanged: $scope.changeTeacher,
                //initialSelectedItems : [
                //  { value: $scope.selected_major.mid },
                //],
                width: "100%"
            });
            $("#time-combo").igCombo({
                mode:"dropdown",
                dataSource:$scope.addExperimentDialog.time_set,
                valueKeyType:"string",
                valueKey:"eid",
                textKeyType:"string",
                textKey:"week",
                enableClearButton:false,
                selectionChanged: $scope.changeTime,
                //initialSelectedItems : [
                //  { value: $scope.selected_class.cid },
                //],
                width: "100%"
            });
    };
    $scope.add_class = function(eid){
        $scope.modifyData('/experiment/user/add',{'eid':eid},undefined,undefined,$scope.changeAll);
    };
    $scope.delete_class = function(eid){
        $scope.modifyData('/experiment/user/delete',{'eid':eid},undefined,undefined,$scope.changeAll);
    };
    $scope.handleDragEnter = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if ($("#"+$scope.editing_block+"-dropZone").length === 0) {
                var html = "<div id=\""+$scope.editing_block+"-dropZone\" ngf-select=\"uploadImages('"+$scope.editing_block+"',$files)\" "+
                 "ngf-drop=\"uploadImages('"+$scope.editing_block+"',$files)\" "+
                 "ngf-multiple=\"true\" ngf-pattern=\"'image/*'\" "+
                 "ngf-accept=\"'image/*'\" ngf-max-size=\"1MB\" ngf-min-height=\"100\" class=\"drop-box-in\"> "+
                 "<span id=\"principle-image-upload-status\">拖拽图片至此添加</span></div>";

                var content = $compile(html)($scope);
                $("#"+$scope.editing_block+"_editor_content").append(content);
                //TODO: 这里设置了5秒后自动消失，防止bug
                $timeout(function(){
                           $("#"+$scope.editing_block+"-dropZone").remove();
                        },5000);
            }
    };
    $scope.handleDragLeave = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            // remove the drop zone element
            $("#"+$scope.editing_block+"-dropZone").remove();
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

    $scope.eventSources = [{events:$scope.events}];
    $scope.freshData($scope.experiment.url,$scope.experiment,$scope.renderAddDialog);
    $scope.changeAll();
});