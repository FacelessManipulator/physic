'use strict';

var loginApp = angular.module('physiclab.loginApp',
        ['physiclab.directives','ngAnimate','angular-md5','igniteui-directives']);

loginApp.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

});
loginApp.controller('loginCtrl',function($scope,$http, md5,$timeout){
    $scope.page = 'login';
    $scope.refreshCapture = function(){
        $http.get("/user/capture").success(function(response){
            $('#captureImg').attr('src',response['img']);
            $('#captureKey').attr('value',response['key']);
        });
    };
    $scope.user={'username':'', 'password':''};
    $scope.capture = '';
    $scope.refreshCapture();
    $scope.login = function(){
        $('#loginBtn').html("登录中<i style='margin-left:10px;' class='icon-spinner icon-spin'></i>");
        var passInput = $('#login-form input')[2];
        var rawPass = passInput.value;
        passInput.value = md5.createHash(rawPass);
        var formData = $('#login-form').serialize();
        $('#loginBtn')[0].disabled = true;
        $http.post("/user/login",formData,
            {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 401:
                        $('#login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>用户名或密码错误");
                        $scope.refreshCapture();
                        break;
                    case 402:
                        $('#login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign '></i>用户尚未激活");
                        $scope.refreshCapture();
                        break;
                    case 403:
                        $('#login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>验证码错误");
                        $scope.refreshCapture();
                        break;
                    case 203:
                        $('#loginBtn').html("<i style='color:green;margin-right:15px;' class='icon-ok '></i>登陆完成，正在跳转...");
                        window.location = response.data.url;
                        break;
                    case 202:
                        $scope.page='first-login';
                        break;
                }
                passInput.value = rawPass;
                $('#loginBtn')[0].disabled = false;
                $('#loginBtn').html("登录");
            },
            function errorCallback(response){
                $('#login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
                $scope.refreshCapture();
                passInput.value = rawPass;
                $('#loginBtn')[0].disabled = false;
                $('#loginBtn').html("登录");
            })
    };
    $scope.firstLogin = function(){
        $('#firstLoginBtn').html("提交中<i style='margin-left:10px;' class='icon-spinner icon-spin'></i>");
        var formData = $('#first-login-form').serialize();
        $('#firstLoginBtn')[0].disabled = true;
        $http.post("/first-login",formData,
            {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}})
            .then(
            function successCallback(response){
                switch(response.data.status){
                    case 402:
                        $('#first-login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>确认密码与密码不一致");
                        $scope.refreshCapture();
                        break;
                    case 403:
                        $('#first-login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>新密码不能与旧密码相同");
                        $scope.refreshCapture();
                        break;
                    case 203:
                        $('#firstLoginBtn').html("<i style='color:green;margin-right:15px;' class='icon-ok '></i>提交完成，正在跳转...");
                        window.location = response.data.url;
                        break;
                }
                $('#firstLoginBtn')[0].disabled = false;
                $('#firstLoginBtn').html("提交");
            },
            function errorCallback(response){
                $('#first-login-status').html("<i style='color:red;margin-right:15px;' class='icon-warning-sign'></i>连接超时,请刷新后在试");
                $scope.refreshCapture();
                $('#firstLoginBtn')[0].disabled = false;
                $('#firstLoginBtn').html("登录");
            })
    };
    $scope.resetPassword = function(){
        if($scope.username == ''){
            alert("请输入用户名");
        }
        else{
            var formData = $('#login-form').serialize();
            $http.post("/user/reset-password",formData,
                {headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}});
            alert("请登录邮箱查看");
        }
    }
});