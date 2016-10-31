#!/usr/bin/env python
# coding=utf-8
from django.contrib.auth.models import User
from models import UserBaseInfo
from django import forms
from captcha.fields import CaptchaField
import re
def validateEmail(self,email):
    if len(email) > 7:
        if re.match("^\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}$", email) != None:
            return True
        return False
    return False

class RegisterForm(forms.Form):
    username = forms.CharField(
        label=u'学号',
        help_text=u'学号可用于登录，只能包含数字',
        max_length=20,
        initial='',
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        )

    email = forms.EmailField(
        label=u'邮箱',
        help_text=u'邮箱可用于登录，最重要的是需要邮箱来找回密码，所以请输入您的可用邮箱。',
        max_length=50,
        initial='',
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        )

    password = forms.CharField(
        label=u'密码',
        help_text=u'密码只有长度要求，长度为 6 ~ 18 。',
        min_length=6,
        max_length=18,
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        )

    confirm_password = forms.CharField(
        label=u'确认密码',
        min_length=6,
        max_length=18,
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        )
    captcha = CaptchaField()

    def clean_username(self):
        username = self.cleaned_data['username']
        if not username.isdigit():
            raise forms.ValidationError(u'账号中只能包含数字')
        res = User.objects.filter(username=username)
        if len(res) != 0:
            raise forms.ValidationError(u'此账号已经注册，请重新输入')
        return username

    def clean_email(self):
        email = self.cleaned_data['email']
        if not self.validateEmail(email):
            raise forms.ValidationError(u'无法识别当前邮箱格式')
        res = User.objects.filter(email=email)
        if len(res) != 0:
            raise forms.ValidationError(u'此邮箱已经注册，请重新输入')
        return email

    def clean(self):
        cleaned_data = super(RegisterForm, self).clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')
        #验证确认密码，可在前端完成，后端这么做没什么必要
        if password and confirm_password:
            if password != confirm_password:
                raise forms.ValidationError(u'两次密码输入不一致，请重新输入')

    def save(self):
        username = self.cleaned_data['username']
        email = self.cleaned_data['email']
        password = self.cleaned_data['password']
        user_b = User.objects.create_user(username, email, password)
        user = userBaseInfo(user=user_b)
        user.save()



class LoginForm(forms.Form):
    username = forms.CharField(
        label=u'学号',
        help_text=u'学号可用于登录，只能包含数字',
        max_length=20,
        initial='',
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        )
    password = forms.CharField(
        label=u'密码',
        help_text=u'密码只有长度要求，长度为 6 ~ 18 。',
        min_length=6,
        max_length=18,
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        )
    captcha = CaptchaField()

    def clean_username(self):
        username = self.cleaned_data['username']
        if not username.isdigit():
            raise forms.ValidationError(u'账号中只能包含数字')