#coding=utf-8
import hashlib, random, sys, json
from usersystem.models import UserBaseInfo, WebsiteConfig
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail, EmailMultiAlternatives
from itsdangerous import URLSafeTimedSerializer as utsr
from django.template import Context, loader
from physicLab1000.settings import SECRET_KEY



def init():
    #初始化组
    groups = ['student','teacher','admin']
    [Group(name=group).save() for group in groups]


def str2md5(string, salty=False, salt=''):
    if salty:
        string += ''.join([str(random.randint(0, sys.maxint)) for i in xrange(3)])
    return hashlib.md5(string + salt).hexdigest()


def add_user(account, name, password, group='student'):
    _user = User()
    _user.username = account
    _user.set_password(str2md5(password))
    try:
        _user.save()
    except:
        return None
    user = UserBaseInfo(user=_user, name=name)
    user.group = group
    user.save()
    return user

def clean_dic(to_clean, allowed_keys):
    clean_keys = [key for key in to_clean if key in allowed_keys]
    clean_data = {}
    Config = WebsiteConfig.objects.all()[0]
    [clean_data.setdefault(key, to_clean[key]) for key in clean_keys if to_clean[key] not in Config.dirty_dic_values]
    return clean_data


def send_mails_to(user_list, subject='', content='', type='text/html', from_email='928835127@qq.com',):
    try:
        to_mails = [user.user.email for user in user_list if user.user.email != '']
        if len(to_mails) > 0:
            msg = EmailMultiAlternatives(subject, content, from_email, to_mails)
            msg.attach_alternative(content, type)
            msg.send()
        return True
    except Exception,e:
        print e.message
        return False


def send_mail_to(user, subject='', content='', from_email='928835127@qq.com',):
    return send_mails_to([user], subject, content, from_email=from_email)


def send_valified_email(user):
    if user.user.is_active:
        Config = WebsiteConfig.objects.all()[0]
        code = Token.generate_validate_token(json.dumps({'username': user.user.username,
                           'email': user.user.email,
                           'salt': str2md5('1', salty=True)}))
        context = {
            'nickname': user.name,
            'account': user.user.username,
            'verify_url': 'http://' + Config.sitename + '/user/verifyMail?auth_code='+code,
        }
        email_template_name = 'email/verify-email.html'
        mail_content = loader.get_template(email_template_name).render(context)
        send_mail_to(user=user, subject='邮箱绑定验证', content=mail_content)


def send_password_modify_email(user):
    if user.is_email_active:
        Config = WebsiteConfig.objects.all()[0]
        context = {
            'nickname': user.name,
            'account': user.user.username,
            'reset_url': 'http://' + Config.sitename + '/reset-password',
        }
        email_template_name = 'email/modify-password-email.html'
        mail_content = loader.get_template(email_template_name).render(context)
        send_mail_to(user=user, subject='密码更改提醒', content=mail_content)


def send_password_reset_email(user):
    if user.is_email_active:
        Config = WebsiteConfig.objects.all()[0]
        # TODO: 注意这里有被重放攻击的危险，1小时内攻击者可通过重放攻击重置密码，解决方法是用redis做token缓存，由于时间关系这里暂搁置
        code = Token.generate_validate_token(json.dumps({'username': user.user.username,
                                                         'action': 'reset-password',
                                                        'salt': str2md5('1', salty=True)}))
        context = {
            'nickname': user.name,
            'account': user.user.username,
            'verify_url': 'http://' + Config.sitename + '/user/reset-password?auth_code='+code,
        }
        email_template_name = 'email/reset-password-email.html'
        mail_content = loader.get_template(email_template_name).render(context)
        send_mail_to(user=user, subject='密码重置验证', content=mail_content)


# 生成及验证token
class Token():
    security_key = SECRET_KEY
    salt = str2md5(SECRET_KEY)

    @classmethod
    def generate_validate_token(cls, data):
        serializer = utsr(cls.security_key)
        return serializer.dumps(data, cls.salt)

    @classmethod
    def confirm_token(cls, token, expiration=3600):
        try:
            serializer = utsr(cls.security_key)
            return serializer.loads(token, salt=cls.salt, max_age=expiration)
        except Exception,e:
            return ''


