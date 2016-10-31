'use strict';

var settingApp = angular.module('physiclab.settingApp',
        ['physiclab.directives','igniteui-directives', 'ngFileUpload',]);
settingApp.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

     // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
        return angular.isObject(data) && String(data) !== '[object File]' ? $.param(data) : data;
    }];
});
settingApp.controller('settingCtrl',function($scope,$http, Upload,$timeout){
    $scope.setting = 'basic';
    $scope.emailChange = false;
    $scope.institute = institutes;
    $scope.findDictFromArray = function(ary,key,value){
         for(var i in ary){
             if(ary[i][key] == value)
                 return ary[i];
         }
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
        $("#class-combo").igCombo('option', 'dataSource', $scope.selected_major.student_class);
        $("#class-combo").igCombo('dataBind');
    };
    $scope.changeClass = function(event, ui){
        $scope.selected_class = ui.items[0].data;
    };
    $scope.render = function(){
        if('undefined' != typeof(m_class)){
            $scope.selected_institute = $scope.findDictFromArray($scope.institute, 'iid', m_institute);
            $scope.selected_major = $scope.findDictFromArray($scope.selected_institute.major, 'mid', m_major);
            $scope.selected_class = $scope.findDictFromArray($scope.selected_major.student_class, 'cid', m_class);
        }
        else{
            $scope.selected_institute = $scope.institute[0];
            $scope.selected_major = $scope.selected_institute.major[0];
            $scope.selected_class = $scope.selected_major.student_class[0];
        }
            $("#institute-combo").igCombo({
                mode:"dropdown",
                dataSource: $scope.institute,
                valueKeyType:"int",
                valueKey:"iid",
                textKeyType:"string",
                textKey:"name",
                enableClearButton:false,
                selectionChanged: $scope.changeInstitute,
                initialSelectedItems : [
                  { value: $scope.selected_institute.iid },
                ],
                width: "100%"
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
                initialSelectedItems : [
                  { value: $scope.selected_major.mid },
                ],
                width: "100%"
            });
            $("#class-combo").igCombo({
                mode:"dropdown",
                dataSource:$scope.selected_major.student_class,
                valueKeyType:"int",
                valueKey:"cid",
                textKeyType:"string",
                textKey:"name",
                enableClearButton:false,
                selectionChanged: $scope.changeClass,
                initialSelectedItems : [
                  { value: $scope.selected_class.cid },
                ],
                width: "100%"
            });
    };
    $scope.saveSettings = function(){
        $('#save-btn').html("提交中<i style='margin-left:10px;' class='icon-spinner icon-spin'></i>");
        var formData = $('#basic-setting-form').serialize();
        $('#save-btn')[0].disabled = true;
        $http.post("/user/basic-setting",formData,
            {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 401:
                        $('#save-btn').html("失败");
                        break;
                    case 201:
                        $('#save-btn').html("已保存");
                        break;
                }
                $timeout(function(){
                    $('#save-btn')[0].disabled = false;
                    $('#save-btn').html("保存");
                },3000);
            },
            function errorCallback(response){
                $('#save-btn').html("连接超时,请刷新后再试");
                $timeout(function(){
                    $('#save-btn')[0].disabled = false;
                    $('#save-btn').html("保存");
                },3000);
            })
    };

    $scope.changePassword = function(){
        $('#btn-pawd').html("提交中<i style='margin-left:10px;' class='icon-spinner icon-spin'></i>");
        $('#btn-pawd')[0].disabled = true;
        $http.post("/user/change-password",'newPassword=' + newPassword.value,
            {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 402:
                        $('#btn-pawd').html("密码不得短于8位");
                        break;
                    case 403:
                        $('#btn-pawd').html("新密码不能与旧密码相同");
                        break;
                    case 203:
                        $('#btn-pawd').html("已更改");
                        break;
                }
                $timeout(function(){
                    $('#btn-pawd')[0].disabled = false;
                    $('#btn-pawd').html("更改");
                },3000);
            },
            function errorCallback(response){
                $('#btn-pawd').html("连接超时,请刷新后再试");
                $timeout(function(){
                    $('#btn-pawd')[0].disabled = false;
                    $('#btn-pawd').html("更改");
                },3000);
            })
    };
    $scope.changeEmail = function(){
        $http.post("/user/verifyMail",'email=' + email.value,
            {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}})
            .then(
            function successCallback(response){
                    alert("请前往邮箱进行验证");

            },
            function errorCallback(response){
                alert("连接超时,请刷新后再试");
            })
    }

    // upload later on form submit or something similar
    $scope.submit = function() {
      if ($scope.headImgForm.headImg.$valid && $scope.headImg) {
        $('#head-img-submit')[0].disabled = true;
        $scope.upload($scope.headImg);
      }
    };

    // upload on file select or drop
    $scope.upload = function (file) {
        Upload.upload({
            url: '/user/change-head-img',
            data: {file: file}
        }).then(function (resp) {
            $('#head-img-submit').html('上传成功');
            $timeout(function(){
                $('#head-img-submit')[0].disabled = false;
                $('#head-img-submit').html('上传');
            },5000);
        }, function (resp) {
            $('#head-img-submit').html('上传失败');
            $timeout(function(){
                $('#head-img-submit')[0].disabled = false;
                $('#head-img-submit').html('上传');
            },5000);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            $('#head-img-submit').html('进度: ' + progressPercentage + '% ');
        });
    };
});