'use strict';

angular.module('physiclab.directives', [])
    .directive("loginBox",function(){
      return{
        restrct:"E",
        replace:true,
        templateUrl:"/static/derective-html/login-box.html",
        controller:function($scope,$http){
          //$scope.getForm = function(){
            //User.account = $scope.loginAccount;
            //User.password = $scope.password;
            //User.login();
            var url = "/user/login/";
            var data={}
            //data['account'] = $scope.loginAccount;
            //data['password'] = $scope.password;
            //$http.post(url,data).success(function(response){
            //  console.log(response);
            //})
          //};
          $scope.forget = function(){
            //User.forget();
          };
        },
      };
    })
    .directive("tailBox",function(){
      return{
        restrct:"E",
        replace:true,
        templateUrl:"/static/derective-html/tail-box.html",
        link:function($scope,element,attr){
          $scope.imgsrc = attr.imgsrc;
          $scope.imghref = attr.href;
          $scope.title = attr.title;
          $scope.sub = attr.sub;
        }
      };
    })
    .directive('pwCheck',[function(){
        return {
            restrct:"A",
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
                var firstPassword = '#' + attrs.pwCheck;
                elem.add(firstPassword).on('keyup', function () {
                    scope.$apply(function () {
                        var v = elem.val()===$(firstPassword).val();
                        ngModel.$setValidity('repeat', v);
                    });
                });
            }
        }
    }])
;
