'use strict';

var adminApp = angular.module('physiclab.admin',
        ['angular-popups','physiclab.directives','igniteui-directives' ,'ngSanitize', 'ngFileUpload','ngTagsInput']);
adminApp.config(function($httpProvider) {
    //TODO: 除了公共接口，本js所用到的所有接口都有管理员验证,必须以管理员账户登陆才能使用
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

     // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? $.param(data) : data;
    }];
});
adminApp.controller('adminCtrl',function($scope,$http, Upload,$compile){
    $scope.page1 = '';
    $scope.page2 = '';
    $scope.page3 = '';
    $scope.csvPopup = {open:{'teacher':false,'student':false}};
    $scope.ExperimentCsvPopup = {open:false};
    $scope.ExperimentImportCsvPopup = {open:false};
    $scope.notice = {open: false, msg:''};
    $scope.csvDialog = {open:{'teacher':false,'student':false},count:0,successNum:0,failList:[],sample:[],csv:null,confirm:function(group){
        if(this.count>0){
            this.csv.forEach(function(e){
                $scope.modifyData('/user/add',{'username':e[0],'name':e[1],'group':group,},undefined,undefined,undefined,function(response){
                        if(response.data.status == 201)
                            $scope.csvDialog.successNum+=1;
                        else{
                            $scope.csvDialog.failList.push({'username':e[0],'name':e[1],'msg':response.data.msg});
                            console.log({'username':e[0],'name':e[1],'msg':response.data.msg});
                        }
                });
            });
        }
        this.open[group]=false;
        $scope.csvPopup.open[group]=true;
    },clear:function(){this.open={teacher:false,student:false};this.count=0;this.successNum=0;this.failList.splice(0,this.failList.length);this.sample.splice(0,this.sample.length)}};
    $scope.ExperimentImportCsvDialog = {open:false,count:0,successNum:0,failList:[],sample:[],csv:null,confirm:function(eid){
        if(this.count>0){
            this.csv.forEach(function(e){
            //TODO: post the csv data [base_title, title, teacher_name, date, time, classroom]
                $scope.modifyData('/experiment/add',
                    {'b_title':e[0],'title':e[1],'teacher_name':e[2],'date':e[3],'time':e[4],'classroom':e[5]},undefined,undefined,undefined,
                    function(response){
                        if(response.data.status == 201)
                            $scope.ExperimentImportCsvDialog.successNum+=1;
                        else{
                            $scope.ExperimentImportCsvDialog.failList.push({'b_title':e[0],'title':e[1],'msg':response.data.msg});
                        }
                });
            });
        }
        this.open=false;
        $scope.ExperimentImportCsvPopup.open=true;
    },clear:function(){this.open=false;this.count=0;this.successNum=0;this.failList.splice(0,this.failList.length);this.sample.splice(0,this.sample.length)}};

    $scope.ExperimentCsvDialog = {open:false,count:0,successNum:0,failList:[],sample:[],csv:null,confirm:function(eid){
        if(this.count>0){
            this.csv.forEach(function(e){
                $scope.modifyData('/experiment/user/add',{'uid':e[0],'eid':eid},undefined,undefined,undefined,function(response){
                        if(response.data.status == 201)
                            $scope.ExperimentCsvDialog.successNum+=1;
                        else{
                            $scope.ExperimentCsvDialog.failList.push({'username':e[0],'name':e[1],'msg':response.data.msg});
                        }
                });
            });
        }
        this.open=false;
        $scope.ExperimentCsvPopup.open=true;
    },clear:function(){this.open=false;this.count=0;this.successNum=0;this.failList.splice(0,this.failList.length);this.sample.splice(0,this.sample.length)}};

    $scope.website_setting = {'url':'user/website', 'content':{}};
    $scope.ExperimentList = [];
    $scope.report_list_render = false;
    $scope.experiments = {"loaded":false, 'content':[],'url':'/experiment/sub'};
    $scope.active_choice = [{"key":'false', 'value':'否'},{"key":'true', 'value':'是'},];
    //TODO: 由于时间的不确定性，此属性已经被废弃
    $scope.class_time = [{"key":'第一大节', 'value':'第一大节'},
                          {"key":'第二大节', 'value':'第二大节'},
                          {"key":'第三大节', 'value':'第三大节'},
                          {"key":'第四大节', 'value':'第四大节'},
                          {"key":'第五大节', 'value':'第五大节'},];
    $scope.experiment = {'name':'experiment', 'loaded':false, 'url':'/experiment/all'};
    $scope.user = {'name':'user', 'show':true, 'loaded':false,   'url':'/user/all'};
    $scope.website = {'name':'website', 'show':false,  'loaded':false,  'url':'/website/setting'};

    $scope.search_teacher_uid = '';
    $scope.search_experiment_eid = '';
    $scope.search_teacher_success = false;
    $scope.selected_institute = {};
    $scope.selected_major = {};
    $scope.findDictFromArray = function(ary,key,value){
         for(var i in ary){
             if(ary[i][key] == value)
                 return ary[i];
         }
    };
    $scope.generateExperimentList = function(){
        $scope.ExperimentList.splice(0, $scope.ExperimentList.length);
        if($scope.experiment.content){
            for(var i in $scope.experiment.content.experiment){
                var name = $scope.experiment.content.experiment[i].title;
                for (var j in $scope.experiment.content.experiment[i].sub_class){
                    var eid = $scope.experiment.content.experiment[i].sub_class[j].eid;
                    var title = $scope.experiment.content.experiment[i].sub_class[j].title;
                    $scope.ExperimentList.push({'key':eid, "value":name+"-"+title});
                }
            }
        }
    };

    $scope.modifyData = function(url, data, origin, id, regenerate,_successCallback, _errorCallback){
        $http.post(url,data,{})
            .then(
            function successCallback(response){
                if(_successCallback){
                    _successCallback(response);
                }
                else{
                    switch(response.data.status){
                    case 401:
                        $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>用户名或密码错误");
                        break;
                    case 201:
                        $('#success').html("<i style='color:green;margin-right:15px;' class='icon-ok '></i>登陆完成，正在跳转...");
                        if(origin){
                            origin.add(response.data.content);
                            if(id){
                                if(regenerate){
                                // TODO: 多重实验表填坑用if
                                    $(id).igHierarchicalGrid("destroy");
                                    $scope.generateHierarchicalGrid(id);
                                    $scope.experiments.loaded = false;
                                }
                                else{
                                    $(id).igGrid("dataSourceObject", origin);
                                    $(id).igGrid('dataBind');
                                }
                            }
                        }
                        break;

                    //TODO: status 506会提供用户友好的错误信息提示,可直接alert那种
                    case 506:
                        if(origin){
                            if(response.data.content)
                                origin.add(response.data.content);
                            if(id){
                                if(regenerate){
                                // TODO: 多重实验表填坑用if
                                    $(id).igHierarchicalGrid("destroy");
                                    $scope.generateHierarchicalGrid(id);
                                    $scope.experiments.loaded = false;
                                }
                            }
                        }
                        if(response.data.msg)
                            alert(response.data.msg);
                        break;
                    }
                }
            },
            function errorCallback(response){
                if(_errorCallback){
                    _errorCallback(response);
                }
                else{
                    $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
                }
            });
    };
    $scope.freshData = function(block, success){
        $http.get(block.url,{})
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
                        block.content = response.data.content;
                        if(success)
                            success();
                        break;
                }
            },
            function errorCallback(response){
                $('#error').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
            });
    };
    $scope.generateHierarchicalGrid = function(id){
        if(id)
            var _id = id;
        else
            var _id = "#experiment-grid";
        $(_id).igHierarchicalGrid({
            width: "100%",
                autoGenerateColumns: false,
                primaryKey: "bid",
                dataSource: $scope.experiment.content,
                dataSourceType: 'json',
                responseDataKey: 'experiment',
                features: [
                            {
                            name: "Updating",
                            enableAddRow: true,
                            enableDeleteRow: true,
                            editMode: "row",
                            autoCommit: true,
                            editRowEnded: function(evt, ui){
                                if(!ui.rowAdding && ui.update){
                                    $scope.modifyData('/experiment/base/modify', ui.values);
                                }
                            },
                            rowAdded: function(evt, ui){
                                $scope.modifyData('/experiment/base/add',ui.values,$scope.experiment.content.experiment,'#experiment-grid',true);
                            },
                            rowDeleted: function(evt, ui){
                                $scope.modifyData('/experiment/base/delete', {'bid':ui.rowID});
                            },
                            columnSettings: [
                                {
                                    columnKey: "bid",
                                    editorType: 'text',
                                    required: false,
                                    validation: true,
                                },
                                {
                                    columnKey: "title",
                                    editorType: 'text',
                                    required: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "name",
                                    editorType: 'text',
                                    required: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "type",
                                    editorType: 'text',
                                    required: false,
                                    validation: true,
                                },
                                {
                                    columnKey: "created_time",
                                    required: false,
                                    readOnly: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "start_time",
                                    editorType: 'datepicker',
                                    showWeek: true,
                                    editorOptions: {
                                        regional: "en-US",
                                        dateInputFormat: "date",
                                        dataMode: 'displayModeText',
                                        dateDisplayFormat: 'yyyy-MM-dd',
                                        placeHolder: "Pick Date",
                                    },
                                    required: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "is_active",
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
                        name: "Responsive",
                        enableVerticalRendering: false,
                        columnSettings: [
                            {
                                columnKey: "bid",
                                classes: "ui-hidden-phone"
                            },
                            {
                                columnKey: "is_active",
                                classes: "ui-hidden-phone"
                            }
                        ]
                    },
                    {
                        name: "Sorting",
                        inherit: true
                    },
                    {
                        name: "Paging",
                        pageSize: 10,
                        type: "local",
                        inherit: true,
                        pageSizeDropDownLocation : "inpager",
                    }
                ],
                columns: [
                   { key: "bid", headerText: "实验id", dataType: "number", width: "0%", hidden:true },
                   { key: "title", headerText: "实验号", dataType: "string", width: "10%" },
                   { key: "name", headerText: "实验名", dataType: "string", width: "30%" },
                   { key: "type", headerText: "实验类型", dataType: "string", width: "10%" },
//                   { key: "start_time", headerText: "开始时间", dataType: "date", width: "20%" },
//                   { key: "created_time", headerText: "创建时间", dataType: "date", width: "20%" },
                   { key: "is_active", headerText: "激活", dataType: "string", width: "20%" },
                   { key: "full", headerText: "满分", dataType: "number", width: "20%",}

                ],
                autoGenerateLayouts: false,
                columnLayouts: [
                    {
                        key: "sub_class",
                        width: "100%",
                        autoGenerateColumns: false,
                        primaryKey: "eid",
                        foreignKey: "bid",
                        autoCommit: true,
                        columns: [
                            { key: "eid", headerText: "课程id", dataType: "number", width: "0%", hidden:true },
                            { key: "title", headerText: "节次号", dataType: "string", width: "10%" },
                            { key: "classroom", headerText: "教室", dataType: "string", width: "25%" },
                            { key: "date", headerText: "实验日期", dataType: "date", width: "20%" },
                            { key: "time", headerText: "实验时间", dataType: "string", width: "15%" },
                            { key: "teacher_name", headerText: "老师", dataType: "string", width: "15%" },
                            { key: "jump", headerText: "学生列表", dataType: "string",unbound:true, width: "10%",
                                template:"<button class='btn btn-success btn-xs' onclick='changeToExperiment(${eid})'>学生列表</button>" },

                        ],
                        features: [
                            {
                            name: "Updating",
                            enableAddRow: true,
                            enableDeleteRow: true,
                            editMode: "row",
                            editRowEnded: function(evt, ui){
                                if(!ui.rowAdding && ui.update){
                                     ui.values.eid = ui.rowID;
                                    $scope.modifyData('/experiment/modify', ui.values);
                                }
                            },
                            rowAdded: function(evt, ui){
                                var bid = evt.target.id.replace(/[^0-9]/ig,"");
                                ui.values.bid = bid;
                                var base;
                                for(var i in $scope.experiment.content.experiment){
                                    if($scope.experiment.content.experiment[i].bid == bid)
                                        base = $scope.experiment.content.experiment[i];
                                }
                                $scope.modifyData('/experiment/add',ui.values,base.sub_class,'#experiment-grid',true);
                            },
                            rowDeleted: function(evt, ui){
                                $scope.modifyData('/experiment/delete', {'eid':ui.rowID});
                            },
                            columnSettings: [
                                {
                                    columnKey: "jump",
                                    editorType: 'text',
                                    readOnly: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "eid",
                                    editorType: 'text',
                                    required: false,
                                    validation: true,
                                },
                                {
                                    columnKey: "title",
                                    editorType: 'text',
                                    required: true,
                                    validation: true,
                                },
                                //TODO: 因为以后选课其中一项条件是根据老师的，所以这里设置教师为必填项
                                //TODO: 只是前端做了限制，后端没有限制
                                {
                                    columnKey: "teacher_name",
                                    editorType: 'text',
                                    required: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "classroom",
                                    editorType: 'text',
                                    required: true,
                                    validation: true,
                                },
                                {
                                    columnKey: "type",
                                    editorType: 'text',
                                    required: false,
                                    validation: true,
                                },
                                {
                                    columnKey: "time",
                                    editorType: 'string',
                                    required: true,
//                                    editorOptions: {
//                                        dataSource: $scope.class_time,
//                                        valueKey: "key",
//                                        textKey: "value",
//                                        mode: "dropdown",
//                                    },
                                    validation: true,
                                },
                                {
                                    columnKey: "date",
                                    editorType: 'datepicker',
                                    showWeek: true,
                                    editorOptions: {
                                        regional: "en-US",
                                        dateInputFormat: "date",
                                        dataMode: 'displayModeText',
                                        dateDisplayFormat: 'yyyy-MM-dd',
                                        placeHolder: "Pick Date",
                                    },
                                    required: true,
                                    validation: true,
                                },
                            ],
                        },
                             {
                                 name: "Responsive",
                                 enableVerticalRendering: false,
                                 columnSettings: [
                                     {
                                         columnKey: "classroom",
                                         classes: "ui-hidden-phone"
                                     },
                                     {
                                         columnKey: "date",
                                         classes: "ui-hidden-phone"
                                     }
                                 ]
                             },
                        ]
                    }
                ]
        });
    };
    $scope.generateGrid = function(id, data){
        var u_columns;
        if(id == "teacher"){
            u_columns = [
                    { headerText: "账号", key: "username", dataType: "string", width: "10%" },
                    { headerText: "姓名", key: "name", dataType: "string", width: "10%" },
                    { headerText: "办公室", key: "address", dataType: "string", width: "15%" },
                    { headerText: "邮箱", key: "email", dataType: "string", width: "15%"},
                    { headerText: "电话", key: "phone", dataType: "string", width: "10%" },
                    { headerText: "激活", key: "is_active", dataType: "string", width: "10%" },
                    { key: "jump", headerText: "实验列表", dataType: "string",unbound:true, width: "15%",
                                template:"<button class='btn btn-success btn-xs' onclick='search_"+id+"(\"${username}\")'>实验列表</button>"},
                ];
        }
        else if (id == 'student'){
            u_columns = [
                    { headerText: "账号", key: "username", dataType: "string", width: "10%" },
                    { headerText: "姓名", key: "name", dataType: "string", width: "10%" },
                    { headerText: "学部/学院", key: "institute", dataType: "string", width: "10%" },
                    { headerText: "专业及班级", key: "major_and_class", dataType: "string", width: "20%" },
//                    { headerText: "班级", key: "student_class", dataType: "string", width: "10%" },

                    { headerText: "邮箱", key: "email", dataType: "string", width: "15%"},
                    { headerText: "电话", key: "phone", dataType: "string", width: "10%" },
                    { headerText: "激活", key: "is_active", dataType: "string", width: "10%" },
                    { key: "jump", headerText: "实验列表", dataType: "string",unbound:true, width: "10%",
                                template:"<button class='btn btn-success btn-xs' onclick='search_"+id+"(\"${username}\")'>实验列表</button>"},
                ];
        }
        $("#" + id + "-grid").igGrid({
            primaryKey: "username",
            width: '100%',
            columns: u_columns,
            autofitLastColumn: true,
            autoGenerateColumns: false,
            dataSource: data,
            showDoneCancelButtons: true,
            autoCommit: true,
            requestError: function(evt, ui) {console.log("request error")},
            features: [
                    {
						name: "Updating",
						enableAddRow: true,
						enableDeleteRow: true,
						editMode: "row",
                        editRowEnded: function(evt, ui){
                            if(!ui.rowAdding && ui.update){
                                $scope.modifyData('/user/modify', ui.values);
                            }
                        },
                        rowAdded: function(evt, ui){
                            ui.values.group = id;
                            //$scope.modifyData('/user/add',ui.values, $scope.user.content[id], "#" + id + "-grid");
                            $scope.modifyData('/user/add',ui.values);

                        },
                        rowDeleted: function(evt, ui){
                            $scope.modifyData('/user/delete', {'uid':ui.rowID});
                        },
						columnSettings: [
							{
							    columnKey: "jump",
								editorType: 'text',
								readOnly: true,
								validation: true,
							},
							{
							    columnKey: "username",
								editorType: 'text',
								required: true,
								validation: true,
							},
							{
							    columnKey: "email",
								editorType: 'text',
								required: false,
								editorOptions: {
								    email: true,
								},
								validation: true,
							},
							{
								columnKey: "is_active",
								editorType: 'combo',
								required: true,
								editorOptions: {
                                    dataSource: $scope.active_choice,
                                    valueKey: "key",
                                    textKey: "value",
                                    mode: "dropdown",
								},
								validation: true,
							}
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
                ]
        });
    };
    $scope.generateExperimentGrid = function(id, data){
        var selected = "";
        $("#" + id + "-grid").igGrid({
            primaryKey: "eid",
            width: '100%',
            columns: [
                    { headerText: "课程id", key: "eid", dataType: "string", width: "0%", hidden:true },
                    { headerText: "实验号", key: "b_title", dataType: "string", width: "15%" },
                    { headerText: "节次号", key: "title", dataType: "string", width: "15%" },
                    { headerText: "实验名", key: "name", dataType: "string", width: "15%" },
                    { headerText: "教室", key: "classroom", dataType: "string", width: "15%"},
                    { headerText: "日期", key: "date", dataType: "date", width: "15%" },
                    { headerText: "时间", key: "time", dataType: "string", width: "15%" },
                    { key: "jump", headerText: "实验详情", dataType: "string",unbound:true, width: "10%",
                      template:"<button class='btn btn-success btn-xs' onclick='changeToExperiment(${eid})'>详情</button>" },
                ],
            autofitLastColumn: true,
            autoGenerateColumns: false,
            dataSource: data,
            showDoneCancelButtons: true,
            autoCommit: false,
            requestError: function(evt, ui) {console.log("request error")},
            features: [
//                    {
//						name: "Updating",
//						enableAddRow: true,
//						enableDeleteRow: true,
//						editMode: "row",
//                        editRowEnded: function(evt, ui){
//                            if(!ui.rowAdding && ui.update){
//                                $scope.modifyData('/experiment/modify', ui.values);
//                            }
//                        },
//                        rowAdded: function(evt, ui){
//                            ui.values.uid = $scope.search_result.username;
//                            $scope.modifyData('/experiment/user/add',ui.values,$scope.search_result.content.experiments,"#" + id + "-grid");
//                        },
//                        rowDeleted: function(evt, ui){
//                            $scope.modifyData('/experiment/user/delete', {'eid':ui.rowID,'uid':$scope.search_result.username});
//                        },
//						columnSettings: [
//							{
//							    columnKey: "eid",
//								editorType: 'combo',
//								readOnly: true,
//							},
//							{
//							    columnKey: "name",
//								editorType: 'text',
//								readOnly: true,
//								validation: true,
//							},
//							{
//							    columnKey: "classroom",
//								editorType: 'text',
//								readOnly: true,
//								validation: true,
//							},
//							{
//								columnKey: "date",
//								editorType: 'text',
//								readOnly: true,
//								validation: true,
//							},
//
//							{
//								columnKey: "time",
//								editorType: 'text',
//								readOnly: true,
//								validation: true,
//							}
//						],
//					},
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
//                    {
//                        name: "ColumnMoving",
//                    },
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
    $scope.generateReportGrid = function(id, data){
        $("#" + id + "-grid").igGrid({
            primaryKey: "rid",
            width: '100%',
            columns: [
                    { headerText: "报告号", key: "rid", dataType: "string", width: "15%" },
                    { headerText: "报告人", key: "name", dataType: "string", width: "15%" },
                    { headerText: "实验名", key: "experiment_name", dataType: "string", width: "40%"},
                    { headerText: "批改", key: "is_corrected", dataType: "string", width: "15%" },
                    { headerText: "成绩", key: "total_grades", dataType: "numeric", width: "15%" },
                ],
            autofitLastColumn: true,
            autoGenerateColumns: false,
            dataSource: data,
            showDoneCancelButtons: true,
            autoCommit: false,
            requestError: function(evt, ui) {console.log("request error")},
            features: [
            //TODO: 为防止批改混乱，在前端防止了管理员对成绩的修改
            //TODO: 服务端层面已经禁止
                    {
						name: "Updating",
						enableAddRow: false,
//						//TODO: 为了安全这里把删除功能也关了
						enableDeleteRow: true,
						editMode: "row",
//                        editRowEnded: function(evt, ui){
//                            if(!ui.rowAdding && ui.update){
//                                //$scope.modifyData('/user/report/modify', ui.values);
//                            }
//                        },
//                        rowAdded: function(evt, ui){
//                            ui.values.uid = $scope.search_result.username;
//                            $scope.modifyData('/user/report/add',ui.values,$scope.search_result.content.reports,"#" + id + "-grid");
//                        },
                        rowDeleted: function(evt, ui){
                            $scope.modifyData('/experiment/user/delete', {'rid':ui.rowID,'uid':$scope.search_result.username});
                        },
						columnSettings: [
							{
							    columnKey: "rid",
								editorType: 'text',
								readOnly: true,
								validation: true,
							},
							{
							    columnKey: "name",
								editorType: 'text',
								readOnly: true,
								validation: true,
							},
							{
								columnKey: "experiment_name",
								editorType: 'text',
								readOnly: true,
								validation: true,
							},
							{
								columnKey: "total_grades",
								editorType: 'numeric',
//								required: false,
//								validation: true,
								readOnly: true,
							},
							{
								columnKey: "is_corrected",
								editorType: 'combo',
								readOnly: true,
//								required: true,
//								editorOptions: {
//                                    dataSource: $scope.active_choice,
//                                    valueKey: "key",
//                                    textKey: "value",
//                                    mode: "dropdown",
//								},
							}
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
    $scope.changeToTeacherList = function(){
        if($scope.user.loaded){
            $("#teacher-grid").igGrid("dataSourceObject", $scope.user.content.teacher);
            $("#teacher-grid").igGrid("dataBind");
        }
        else{
            $scope.generateGrid('teacher', $scope.user.content.teacher);
            $scope.generateGrid('student', $scope.user.content.student);
            $scope.user.loaded = true;
        }
        $scope.page1 = 'teacher-list';
    };
    $scope.changeToStudentList = function(){
        if($scope.user.loaded){
            $("#student-grid").igGrid("dataSourceObject", $scope.user.content.student);
            $("#student-grid").igGrid("dataBind");
        }
        else{
            $scope.generateGrid('teacher', $scope.user.content.teacher);
            $scope.generateGrid('student', $scope.user.content.student);
            $scope.user.loaded = true;
        }
        $scope.page1 = 'student-list';
    };
    $scope.changeToExperimentList = function(){
        if($scope.experiment.loaded){
        //TODO: regenerate
            $("#experiment-grid").igHierarchicalGrid("destroy");
            $scope.generateHierarchicalGrid("#experiment-grid");
        }
        else{
            $scope.generateHierarchicalGrid();
            $scope.experiment.loaded = true;
        }
        $scope.page1 = 'experiment-list';
    };
    $scope.changeInstitute = function(event, ui){
        $scope.selected_institute = ui.items[0].data;
        if(!$scope.selected_institute.major[0])
            $scope.selected_major = $scope.selected_institute.major[0];
        $("#major-combo").igCombo('option', 'dataSource', $scope.selected_institute.major);
        $("#major-combo").igCombo('dataBind');
    };
    $scope.changeMajor = function(event, ui){
        $scope.selected_major = ui.items[0].data;
    };
    $scope.saveSettings = function(){
        $scope.website_setting.content.start_week_day = $("#start_week_day").igDatePicker("value");
        $scope.modifyData($scope.website_setting.url,$scope.website_setting.content);
    }
    $scope.report_tag_add = function(tag){
        var dup = $scope.findDictFromArray($scope.website_setting.content.report_tags, 'reason', tag.reason);
        if(!dup)
            $scope.modifyData('/user/website',{'tag': tag.reason},$scope.website_setting.content.report_tags);
        return false;
    }
    $scope.report_tag_removed = function(tag){
        $scope.modifyData('/user/website',{'tid': tag.tid});
    }
    $scope.institute_add = function(tag){
        var dup = $scope.findDictFromArray($scope.website_setting.content.institute, 'name', tag.name);
        if(!dup)
            $scope.modifyData('/user/institute',{'name': tag.name},$scope.website_setting.content.institute);
        return false;
    }
    $scope.institute_removed = function(tag){
        $scope.modifyData('/user/institute',{'iid': tag.iid});
    }
    $scope.major_add = function(tag){
        var dup = $scope.findDictFromArray($scope.selected_institute.major, 'name', tag.name);
        if(!dup)
            $scope.modifyData('/user/major',{'iid':$scope.selected_institute.iid, 'name': tag.name},$scope.selected_institute.major);
        return false;
    }
    $scope.major_removed = function(tag){
        $scope.modifyData('/user/major',{'mid': tag.mid});
    }
    $scope.class_add = function(tag){
        var dup = $scope.findDictFromArray($scope.selected_major.student_class, 'name', tag.name);
        if(!dup)
            $scope.modifyData('/user/class',{'mid':$scope.selected_major.mid, 'name': tag.name},$scope.selected_major.student_class);
        return false;
    }
    $scope.class_removed = function(tag){
        $scope.modifyData('/user/class',{'cid': tag.cid});
    }
    $scope.render_website_setting = function(){
        $scope.page1 = "website";
        if($scope.website_setting.loaded){
            $("#start_week_day").igDatePicker("value",$scope.website_setting.content.start_week_day);

            $scope.selected_institute = $scope.website_setting.content.institute[0];
            $scope.selected_major = $scope.selected_institute.major[0];
            $("#major-combo").igCombo('option', 'dataSource', $scope.selected_institute.major);
            $("#major-combo").igCombo('dataBind');
            $("#institute-combo").igCombo('option', 'dataSource', $scope.website_setting.content.institute);
            $("#institute-combo").igCombo('dataBind');
            return 0;
        }
        else{
            $scope.website_setting.loaded = true;
            $scope.selected_institute = $scope.website_setting.content.institute[0];
            $scope.selected_major = $scope.selected_institute.major[0];
            $("#start_week_day").igDatePicker({
                                        regional: "en-US",
                                        dateInputFormat: "date",
                                        dataMode: 'displayModeText',
                                        dateDisplayFormat: 'yyyy-MM-dd',
                                        placeHolder: "Pick Date",
                                        value: $scope.website_setting.content.start_week_day,
            });
            $("#institute-combo").igCombo({
                mode:"dropdown",
                dataSource: $scope.website_setting.content.institute,
                valueKeyType:"int",
                valueKey:"iid",
                textKeyType:"string",
                textKey:"name",
                enableClearButton:false,
                selectionChanged: $scope.changeInstitute,
            });
            $("#major-combo").igCombo({
                mode:"dropdown",
                dataSource:$scope.selected_institute.major,
                valueKeyType:"int",
                valueKey:"mid",
                textKeyType:"string",
                textKey:"name",
                enableClearButton:false,
                selectionChanged: $scope.changeMajor,
            });
        }
    };
    $scope.changeToWebsite = function(){
        $scope.freshData($scope.website_setting, $scope.render_website_setting);
    };
    $scope.changeToTeacher = function(){
        $scope.page1 = "teacher";
    };
    $scope.changeToStudent = function(){
        $scope.page1 = "student";
    };
    $scope.countDictFromArray = function(ary,key,value){
        var count = 0;
        for(var i in ary){
            if(ary[i][key] == value)
                count++;
        }
        return count;
    };
    $scope.render_experiment = function(){
        $scope.selected_experiment.loaded = true;
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
        if(!$scope.report_list_render){
            $scope.generateReportGrid('report', $scope.selected_experiment.content.reports);
            $scope.report_list_render = true;
        }
        else{
            $("#report-grid").igGrid("dataSourceObject", $scope.selected_experiment.content.reports);
            $("#report-grid").igGrid("dataBind");
        }
    };
    $scope.changeToExperiment = function(eid){
        if(eid)
            $scope.search_experiment_eid = eid;
        $scope.page1 = 'experiment';
        if(!$scope.experiments.loaded){
            $scope.experiments['url'] = '/experiment/sub';
            $scope.freshData($scope.experiments);
            $scope.experiments.loaded = true;
        }
        var temp = $scope.findDictFromArray($scope.experiments.content, 'eid', $scope.search_experiment_eid);
        if(temp){
            $scope.selected_experiment = temp;
            $scope.selected_experiment['url'] = '/experiment/sub?eid='+$scope.search_experiment_eid;
            $scope.freshData($scope.selected_experiment, $scope.render_experiment);
        }
        else{
            //TODO: 不存在的eid,未来可以换更加友好的提示
            //alert("不存在的实验号");
        }
    };

    $scope.exportExcel = function(id){
        $.ig.GridExcelExporter.exportGrid($("#"+id), {
                            fileName: "Excel_"+id,
                            gridFeatureOptions: {
                                summaries: "none",
                                sorting: "none",
                                paging: "allRows",
                                filtering: "none",
                            }
                        });
    };
    $scope.exportExcel2 = function(id){
        $.ig.GridExcelExporter.exportGrid($("#"+id), {
                            fileName: "Excel_"+id,
                            dataExportMode: "allRows",
                            gridFeatureOptions: {
                                summaries: "none",
                                sorting: "none",
                                paging: "allRows",
                                filtering: "none",
                            }
                        });
    };
    $scope.editor_edit = function(block){
        block.editing = true;
        $("#"+block.name+"-uploader").igUpload({
                mode: "multiple",
                autostartupload: true,
                progressUrl: "/file-receive",
                controlId: "serverID1",
                multipleFiles: true,
                maxUploadedFiles: 3,
                allowedExtensions: ["gif", "jpg", "bmp", "png", "jpeg"],
                errorMessageValidatingFileExtension: "只可上传不超过1M的图像",
                onError: function (e, args) {
                    $("#" +block.name+ "-error-message").html(args.errorMessage).stop(true, true).fadeIn(600).delay(3000).fadeOut(700);

                },
                fileUploaded: function (evt, ui) {
                    loadDataUriImages(ui.fileInfo.file);
                    // remove the drop zone element
                    $("#dropZone").remove();
                    // reset drop counter
                    dragging = 0;
                }
        });
    };
    $scope.editor_save = function(block){
        block.content = $("#" +block.name+ "_editor").igHtmlEditor("getContent", "html");
        block.editing = false;
    };
    $scope.uploadImage = function(block, files){
        if (files && files.length) {
           for (var i = 0; i < files.length; i++) {
              Upload.upload({
                url: '/file-receiver',
                data: {file: file, 'experiment': $scope.experiment}
                }).then(function (resp) {
                    console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                }, function (resp) {
                    console.log('Error status: ' + resp.status);
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                });
           }
      }
    };
    $scope.insert_image = function(block, url){
        var span = document.createElement('span'),editorContent = $("#"+block.name+"-editor").igHtmlEditor("getContent", "html");
        span.innerHTML = ['<img style="border: 1px solid #000;margin: 10px 5px 0 0;max-height: 150px; max-width: 200px" src="',url,'" />'].join('');
        $("#"+block.name+"-editor").igHtmlEditor("setContent", editorContent + $(span).html(), "html");
    };
    $scope.editor_cancel = function(block){block.editing = false;};
    $scope.search_teacher = function(uid){
        if(uid)
            $scope.search_teacher_uid = uid;
        if(!$scope.user.loaded){
            $scope.freshData($scope.user);
        }
        if(!$scope.experiment.loaded){
            $scope.freshData($scope.experiment,$scope.generateExperimentList);
        }
        else{
            $scope.generateExperimentList();
        }
        $scope.search_result = $scope.findDictFromArray($scope.user.content.teacher,'username',$scope.search_teacher_uid);
        if($scope.search_result){
            $scope.search_result.url = "/user/find?uid=" + $scope.search_result.username;
            $scope.freshData($scope.search_result, $scope.render_teacher_page);
        }
    };
    $scope.render_teacher_page = function(){
        $scope.page1 = "teacher";
        $('#teacher-head-img').attr('src',$scope.search_result.content.photo);
        if($scope.search_teacher_success){
            $("#teacher-experiment-grid").igGrid("dataSourceObject", $scope.search_result.content.experiments);
            $("#teacher-experiment-grid").igGrid('dataBind');
        }
        else{
            $scope.generateExperimentGrid("teacher-experiment", $scope.search_result.content.experiments);
            $scope.search_teacher_success = true;
        }
    };
    $scope.search_student = function(uid){
        if(uid)
            $scope.search_student_uid = uid;
        if(!$scope.user.loaded){
            $scope.freshData($scope.user);
        }
        if(!$scope.experiment.loaded){
            $scope.freshData($scope.experiment,$scope.generateExperimentList);
        }
        else{
            $scope.generateExperimentList();
        }
        $scope.search_result = $scope.findDictFromArray($scope.user.content.student,'username',$scope.search_student_uid);
        if($scope.search_result){
            $scope.search_result.url = "/user/find?uid=" + $scope.search_result.username;
            $scope.freshData($scope.search_result, $scope.render_student_page);
        }
    };
    $scope.render_student_page = function(){
        $scope.page1 = "student";
        $('#student-head-img').attr('src',$scope.search_result.content.photo);
        if($scope.search_student_success){
            $("#student-experiment-grid").igGrid("dataSourceObject", $scope.search_result.content.experiments);
            $("#student-experiment-grid").igGrid('dataBind');
            $("#student-report-grid").igGrid("dataSourceObject", $scope.search_result.content.reports);
            $("#student-report-grid").igGrid('dataBind');
        }
        else{
            $scope.generateExperimentGrid("student-experiment", $scope.search_result.content.experiments);
            $scope.generateReportGrid("student-report", $scope.search_result.content.reports);
            $scope.search_student_success = true;
        }
    };
    $scope.parse_csv = function(file,group){
        if(typeof FileReader == 'undefined'){
            alert("浏览器不支持FileReader接口！请改用chrome或其他浏览器再次尝试");
            return;
        }
        var reader = new FileReader();
        reader.onload = function(){
            var content = reader.result;
            var csv = new CSV(content).parse();
            $scope.csvDialog.count = csv.count();
            if($scope.csvDialog.count>0){
                $scope.csvDialog.sample = csv[0];
                $scope.csvDialog.csv = csv;
            }
            $scope.csvDialog.open[group]=true;
        }
        reader.readAsText(file,'gb2312');//默认utf-8编码
    };
    $scope.parse_csv_experiment = function(file,eid){
        if(typeof FileReader == 'undefined'){
            alert("浏览器不支持FileReader接口！请改用chrome或其他浏览器再次尝试");
            return;
        }
        var reader = new FileReader();
        reader.onload = function(){
            var content = reader.result;
            var csv = new CSV(content).parse();
            $scope.ExperimentCsvDialog.count = csv.count();
            if($scope.ExperimentCsvDialog.count>0){
                $scope.ExperimentCsvDialog.sample = csv[0];
                $scope.ExperimentCsvDialog.csv = csv;
            }
            $scope.ExperimentCsvDialog.open=true;
            $scope.ExperimentCsvDialog.cur_eid=eid;
        }
        reader.readAsText(file,'gb2312');//默认utf-8编码
    };

    $scope.parse_csv_experiment_import = function(file){
        if(typeof FileReader == 'undefined'){
            alert("浏览器不支持FileReader接口！请改用chrome或其他浏览器再次尝试");
            return;
        }
        var reader = new FileReader();
        reader.onload = function(){
            var content = reader.result;
            var csv = new CSV(content).parse();
            //TODO: parse the import csv
            $scope.ExperimentImportCsvDialog.count = csv.count();
            if($scope.ExperimentImportCsvDialog.count>0){
                $scope.ExperimentImportCsvDialog.sample = csv[0];
                $scope.ExperimentImportCsvDialog.csv = csv;
            }
            $scope.ExperimentImportCsvDialog.open=true;
        }
        reader.readAsText(file,'gb2312');//默认utf-8编码
    };
    $scope.resetPassword = function(username){
        $http.get('/user/reset-password?username='+username,{}).then(
            function successCallback(response){
                if(response.data.status == 201){
                    $('#ajax-state').html("重置密码成功");
                }
                else{
                    $('#ajax-state').html("重置密码失败:未知错误");
                }
            },
            function errorCallback(response){
                $('#ajax-state').html("服务器连接失败，请刷新后再试");
            });
    };
    $scope.freshData($scope.user,$scope.changeToStudentList);
    $scope.freshData($scope.experiments);
    $scope.experiments.loaded = true;
});
