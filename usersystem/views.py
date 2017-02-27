#coding=utf-8
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.http.response import HttpResponse, JsonResponse
from models import UserBaseInfo, Report, WebsiteConfig, ReportTag, Institute, Major, StudentClass
from forms import RegisterForm,LoginForm
from django.views.generic.edit import FormView
from django.core.urlresolvers import reverse_lazy
from captcha.models import CaptchaStore,get_safe_now
from django.contrib.auth.models import User
from captcha.helpers import captcha_image_url
from django.contrib.auth.decorators import login_required
import utils, json, datetime
from django.views.decorators.csrf import csrf_exempt
# Create your views here.


def valifiedCapture(request):
    captureKey = request.POST.get('captureKey', '')
    captureWord = request.POST.get('capture', '')
    response, captureWord = (captureWord or '').strip().lower(), ''
    CaptchaStore.remove_expired()
    try:
        CaptchaStore.objects.get(response=response, hashkey=captureKey, expiration__gt=get_safe_now()).delete()
        return True
    except CaptchaStore.DoesNotExist:
        return False

def tempView(request):
    return render(request,'usersystem/login_t.html')

class RegisterView(FormView):
    template_name = 'usersystem/register.html'
    form_class = RegisterForm
    success_url = reverse_lazy('/login')
    def form_valid(self, form):
        form.save()
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password')
        user = authenticate(username=username, password=password)
        login(self.request, user)
        return super(RegisterView, self).form_valid(form)

    def form_invalid(self, form):
        return super(RegisterView, self).form_invalid(form)

class LoginView(FormView):
    template_name = 'login_t.html'
    form_class = LoginForm
    success_url =  reverse_lazy('/login')
    def form_valid(self, form):
        user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
        if user is not None:
            if user.is_active:
                login(self.request, user)
                return super(LoginView,self).form_valid()
        else:
            return HttpResponse("error username or password")


def m_login(request):
    if request.method == 'POST':
        if not valifiedCapture(request):
            return JsonResponse({'status': 403})
        dirtName = request.POST.get('username', '')
        dirtPass = request.POST.get('password', '')
        try:
            u = User.objects.get(username=dirtName)
            if not u.check_password(dirtPass):
                return JsonResponse({'status': 401})
            if u.userBaseInfo.is_account_active:
                login(request, u)
                return JsonResponse({'status': 203, 'url': '/'})
            else:
                login(request, u)
                return JsonResponse({'status': 202})
        except Exception,e:
            return JsonResponse({'status': 401})
    elif request.method == 'GET':
        user = request.user
        Config = WebsiteConfig.objects.all()[0]
        if user.is_authenticated():
            return render(request, 'usersystem/login_t.html', context={'User': user.userBaseInfo, 'Config': Config})
        else:
            return render(request, 'usersystem/login_t.html', context={'Config': Config})

def m_logout(request):
        logout(request)
        return redirect('/login')


def g_capture(request):
    if request.method == 'GET':
        cap = dict()
        cap['key'] = CaptchaStore.generate_key()
        cap['img'] = captcha_image_url(cap['key'])
        return JsonResponse(cap)


@login_required
@csrf_exempt
def first_login(request):
    if request.method == 'POST':
        user = request.user
        if not user.userBaseInfo.is_account_active:
            new_password = request.POST.get('newPassword')
            confirm_password = request.POST.get('repeatPassword')
            email = request.POST.get('email')
            if new_password is None or confirm_password is None or new_password != confirm_password:
                return JsonResponse({'status': 402, 'msg': u'确认密码与新密码不一致'})
            if user.check_password(utils.str2md5(new_password)):
                return JsonResponse({'status': 403, 'msg': u'新密码不能于旧密码相同'})
            user.set_password(utils.str2md5(new_password))
            user.email = email
            user.userBaseInfo.is_account_active = True
            user.save()
            user.userBaseInfo.save()
            utils.send_valified_email(user.userBaseInfo)
            login(request, user)
            return JsonResponse({'status': 203, 'msg': u'密码修改成功', 'url': '/setting'})
        else:
            return redirect('/')
    else:
        return redirect('/')


@login_required
@csrf_exempt
def changePassword(request):
    if request.method =='POST':
        user = request.user
        new_password = request.POST.get('newPassword', '')
        if len(new_password) < 8:
            return JsonResponse({'status': 402, 'msg': u'密码不能少于8位'})
        if user.check_password(utils.str2md5(new_password)):
            return JsonResponse({'status': 403, 'msg': u'新密码不能于旧密码相同'})
        user.set_password(utils.str2md5(new_password))
        user.save()
        utils.send_password_modify_email(user.userBaseInfo)
        return JsonResponse({'status': 203, 'msg': u'密码修改成功', 'url': '/setting'})


@login_required
def verify_mail(request):
    if request.method == 'GET':
        auth_code = request.GET.get('auth_code')
        if auth_code is not None:
            try:
                data = json.loads(utils.Token.confirm_token(auth_code))
                user = get_object_or_404(User, username=data.get('username', ''))
                if user.email == data.get('email', ''):
                    user.userBaseInfo.set(is_email_active=True)
                    return redirect('/')
            except Exception,e:
                return redirect('/')
        else:
            redirect('/')
    elif request.method == 'POST':
        try:
            user = request.user
            email = request.POST.get('email', '')
            user.email = email
            user.userBaseInfo.is_email_active = False
            user.save()
            user.userBaseInfo.save()
            utils.send_valified_email(user.userBaseInfo)
            return JsonResponse({'status':201})
        except:
            return JsonResponse({'status':401})
    else:
        redirect('/')


def reset_password(request):
    if request.method == 'GET':
        auth_code = request.GET.get('auth_code')
        _username = request.GET.get('username')
        if auth_code is not None:
            pac = json.loads(utils.Token.confirm_token(auth_code))
            try:
                if pac['action'] == 'reset-password':
                    username = pac['username']
                    user = User.objects.get(username=username)
                    Config = WebsiteConfig.objects.all()[0]
                    user.set_password(utils.str2md5(Config.default_password))
                    user.save()
                    utils.send_password_modify_email(user.userBaseInfo)
                    return redirect('/login')
                return redirect('/login')
            except:
                return redirect('/login')
        elif _username is not None and request.user.is_superuser:
            try:
                user = User.objects.get(username=_username)
                Config = WebsiteConfig.objects.all()[0]
                user.set_password(utils.str2md5(Config.default_password))
                user.save()
                utils.send_password_modify_email(user.userBaseInfo)
                return JsonResponse({'status': 201})
            except:
                return JsonResponse({'status': 501})
    if request.method == 'POST':
        username = request.POST.get('username', '')
        try:
            user = User.objects.get(username=username)
            utils.send_password_reset_email(user.userBaseInfo)
        except:
            pass
        return JsonResponse({'status': 201})

@login_required
def settings(request):
    Config = WebsiteConfig.objects.all()[0]
    if request.method == 'GET':
        user = request.user.userBaseInfo
        return render(request, 'usersystem/settings.html', context={'User': user,
                                    'Config': Config,'institutes': [ins.get_dict() for ins in Institute.objects.all()]})
    if request.method == 'POST':
        user = request.user.userBaseInfo
        cid = request.POST.get('cid')
        if user.user.is_superuser:
            clean_data = utils.clean_dic(request.POST.dict(), Config.user_settings_allow_super_change)
        else:
            clean_data = utils.clean_dic(request.POST.dict(), Config.user_settings_allow_user_change)
        user.update(clean_data)
        try:
            if cid is not None:
                stu_class = StudentClass.objects.get(cid=cid)
                user.student_class = stu_class
                user.save()
        except:
            return JsonResponse({'status':501})
        return JsonResponse({'status': 201})


@csrf_exempt
@login_required
def changeHeadImg(request):
    if request.method == 'POST':
        user = request.user.userBaseInfo
        headImg = request.FILES.get('file')
        if headImg is not None:
            if user.photo is not None:
                user.photo.delete()
            user.photo = headImg
            user.save()
            return JsonResponse({'status': '201', 'url': user.photo.url})
        else:
            return JsonResponse({'status': '401'})
    if request.method == 'GET':
        user = request.user.userBaseInfo
        return JsonResponse({'status': '201', 'url': user.photo.url})

@login_required
def add_user(request):
    if request.method == 'POST':
        user = request.user.userBaseInfo
        if not user.user.is_superuser:
            return JsonResponse({'status': 501, 'msg': '权限不足'})
        else:
            username = request.POST.get('username', '')
            name = request.POST.get('name', '')
            group = request.POST.get('group', 'student')
            institute = request.POST.get('institute','')
            major = request.POST.get('major','')
            student_class = request.POST.get('student_class','')
            Config = WebsiteConfig.objects.all()[0]
            user = utils.add_user(username, name, Config.default_password, group)
            if user is not None:
                try:
                    ins = Institute.objects.get(name=institute)
                    m = ins.major.get(name=major)
                    c = m.student_class.get(name=student_class)
                    user.student_class = c
                    user.save()
                except:
                    pass
                return JsonResponse({'status': 201, 'msg': '添加成功', 'content': user.get_dict()})
            else:
                return JsonResponse({'status': 503, 'msg': '重复的账号'})
    return JsonResponse({'status': 505, 'msg': '不支持的操作'})


@login_required
def delete_user(request):
    user = request.user.userBaseInfo
    if not user.user.is_superuser:
        return JsonResponse({'status': 501, 'msg': '权限不足'})
    if request.method == 'POST':
        uid = request.POST.get('uid')
        if uid is not None:
            try:
                user = User.objects.get(username=uid).userBaseInfo
                user.delete()
                return JsonResponse({'status': 201, 'msg': '删除成功'})
            except:
                return JsonResponse({'status': 503, 'msg': '删除失败'})
    return JsonResponse({'status': 505, 'msg': '不支持的操作'})


@login_required
def modify_user(request):
    user = request.user.userBaseInfo
    if not user.user.is_superuser:
        return JsonResponse({'status': 501, 'msg': '权限不足'})
    if request.method == 'POST':
        username = request.POST.get('username', '')
        name = request.POST.get('name', '')
        email = request.POST.get('email')
        phone = request.POST.get('phone','')
        institute = request.POST.get('institute','')
        major = request.POST.get('major','')
        student_class = request.POST.get('student_class','')
        address = request.POST.get('address','')
        try:
            user = User.objects.get(username=username)
            user = user.userBaseInfo
            user.name = name
            user.phone = phone
            user.address = address
            if email is not None:
                user.user.email = email
            user.user.save()
            user.save()
            try:
                ins = Institute.objects.get(name=institute)
                m = ins.major.get(name=major)
                c = m.student_class.get(name=student_class)
                user.student_class = c
                user.save()
            except:
                pass
            return JsonResponse({'status': 201, 'msg': '修改成功'})
        except:
            return JsonResponse({'status': 503, 'msg': '修改失败'})


@login_required
def opt_user(request):
    user = request.user.userBaseInfo
    if not user.user.is_superuser:
        return JsonResponse({'status': 501, 'msg': '权限不足'})
    if request.method == 'GET':
        uid = request.GET.get('uid')
        if uid is not None:
            try:
                u = User.objects.get(username=uid).userBaseInfo
                return JsonResponse({'status': 201, 'msg': '查找成功', 'content': u.get_dict(False)})
            except:
                return JsonResponse({'status': 503, 'msg': '查找失败'})
        else:
            teachers = UserBaseInfo.objects.filter(group='teacher')
            teachers = [teacher.get_dict() for teacher in teachers]
            students = UserBaseInfo.objects.filter(group='student')
            students = [student.get_dict() for student in students]
            return JsonResponse({'status':201, 'content': {'teacher':teachers, 'student': students}})


@login_required
def get_report(request):
    user = request.user.userBaseInfo
    if request.method == 'GET':
        rid = request.GET.get('rid')
        if rid is not None:
            try:
                report = Report.objects.get(rid=rid)
                if not user.user.is_superuser and report.user.user.username != user.user.username \
                        and user.group != 'teacher':
                    return JsonResponse({'status': 501, 'msg': '权限不足'})
                return JsonResponse({'status': 201, 'msg': '查找成功', 'content': report.get_dict(False)})
            except:
                return JsonResponse({'status': 503, 'msg': '查找失败'})
        else:
            report_set = user.report.filter(experiment__isnull=False)
            reports = [report.get_dict() for report in report_set]
            return JsonResponse({'status': 201, 'content':  reports})


@login_required
def modify_report(request):
    user = request.user.userBaseInfo
    if request.method == 'POST':
        rid = request.POST.get('rid')
        block = request.POST.get('block')
        content = request.POST.get('content')
        is_corrected = request.POST.get('is_corrected')
        grade = request.POST.get('grade')
        confirmed = request.POST.get('confirmed')
        if user.group =='student' and rid is not None and block is not None and content is not None:
            try:
                report = Report.objects.get(rid=rid)
                experiment = report.experiment.get_dict(simple=False)
                Config = WebsiteConfig.objects.all()[0]
                # TODO: 这边为了安全限制了管理员和老师对报告的误更改
                # 删去时间过去无法更改这一条件
                # or experiment.get('end_date', '2050-01-01') < str(datetime.date.today())\
                if report.user.user.username != user.user.username \
                        or block not in Config.report_content_editable\
                        or not experiment['base']['is_active']\
                        or report.is_submit:
                    return JsonResponse({'status': 501, 'msg': '权限不足'})
                setattr(report, block, content)
                report.save()
                return JsonResponse({'status': 201, 'msg': '修改成功'})
            except Exception,e:
                return JsonResponse({'status': 503, 'msg': '修改失败'})
        elif user.group == 'teacher' and rid is not None and (grade is not None or is_corrected is not None):
            try:
                report = Report.objects.get(rid=rid)
                teacher = report.experiment.user.filter(group='teacher')[0]
                if teacher.user.username != user.user.username \
                        or not report.experiment.base.is_active\
                        or not report.is_submit:
                    # TODO: 这里没有禁止修改未关闭实验报告成绩，是为了以后方便提前批改
                    return JsonResponse({'status': 501, 'msg': '权限不足'})
                if grade is not None:
                    report.total_grades = grade
                    if confirmed is not None:
                        report.is_corrected = True
                        report.corrected_time = datetime.datetime.now()
                if is_corrected is not None:
                    report.is_corrected = False if is_corrected == 'false' else True
                report.save()
                return JsonResponse({'status': 201, 'msg': '修改成功'})
            except:
                return JsonResponse({'status': 503, 'msg': '修改失败'})
        else:
            return JsonResponse({'status': 503, 'msg':  '修改失败'})

@login_required
def receive_image(request):
    user = request.user.userBaseInfo
    if request.method == 'POST':
        rid = request.POST.get('rid')
        image = request.FILES.get('file')
        try:
            if rid is not None and image is not None:
                report = Report.objects.get(rid=rid)
                if report.user.user.username != user.user.username or not report.experiment.base.is_active:
                    return JsonResponse({'status': 501, 'msg': '权限不足'})
                img = report.image.create(image=image)
                return JsonResponse({'status': 201, 'msg': '上传成功', 'url': img.image.url})
            else:
                return JsonResponse({'status': 503, 'msg': '上传失败'})
        except Exception,e:
            return JsonResponse({'status': 503, 'msg': '上传失败'})
    else:
        return JsonResponse({'status': 505, 'msg': '不支持的操作'})


@login_required
def receive_file(request):
    user = request.user.userBaseInfo
    if request.method == 'POST':
        rid = request.POST.get('rid')
        attach_file = request.FILES.get('file')
        try:
            if rid is not None and attach_file is not None:
                report = Report.objects.get(rid=rid)
                if report.user.user.username != user.user.username or not report.experiment.base.is_active:
                    return JsonResponse({'status': 501, 'msg': '权限不足'})
                attach = report.file.create(attach_file=attach_file,name=attach_file.name)
                return JsonResponse({'status': 201, 'msg': '上传成功', 'content': {'url': attach.attach_file.url, 'name': attach.name}})
            else:
                return JsonResponse({'status': 503, 'msg': '上传失败'})
        except Exception,e:
            return JsonResponse({'status': 503, 'msg': '上传失败'})
    else:
        return JsonResponse({'status': 505, 'msg': '不支持的操作'})

@login_required
def opt_website_setting(request):
    user = request.user
    Config = WebsiteConfig.objects.all()[0]
    if not user.is_superuser:
        return JsonResponse({'status': 501, 'msg': '权限不足'})
    if request.method == 'GET':
        return JsonResponse({'status': 201, 'content': Config.get_dict()})
    if request.method == 'POST':
        sitename = request.POST.get('sitename')
        default_password = request.POST.get('default_password')
        report_editing_day = request.POST.get('report_editing_day')
        start_week_day = request.POST.get('start_week_day')
        tid = request.POST.get('tid')
        tag = request.POST.get('tag')
        welcome_word = request.POST.get('welcome_word')
        if sitename is not None:
            Config.sitename = sitename
        if start_week_day is not None:
            Config.start_week_day = start_week_day
        if welcome_word is not None:
            Config.welcome_word = welcome_word
        if report_editing_day is not None:
            try:
                Config.report_editing_day = int(report_editing_day)
            except:
                return JsonResponse({'status': 503, 'msg': '报告期限格式不正确'})
        if default_password is not None:
            if len(default_password) < 6:
                return JsonResponse({'status': 503, 'msg': '密码至少6位'})
            else:
                Config.default_password = default_password
        if tid is not None:
            if Config.tag.filter(tid=tid).exists():
                _tag = ReportTag.objects.get(tid=tid)
                _tag.delete()
        if tag is not None:
            tag = Config.tag.create(reason=tag)
            return JsonResponse({'status': 201, 'content': tag.get_dict()})
        try:
            Config.save()
        except:
            return JsonResponse({'status': 503, 'msg': '修改失败'})
        return JsonResponse({'status': 201})

@login_required
def opt_tag(request):
    user = request.user.userBaseInfo
    # TODO: 只有老师能添加删除修改tag
    if user.group != 'teacher':
        return JsonResponse({'status': 505, 'msg': '权限不足'})
    if request.method == 'POST':
        tid = request.POST.get('tid')
        rid = request.POST.get('rid')
        grade = request.POST.get('grade')
        reason = request.POST.get('reason')
        html = request.POST.get('html')
        block = request.POST.get('block')
        # 添加
        if rid is not None:
            try:
                report = Report.objects.get(rid=rid)
                tag = report.tag.create(grade=int(grade), reason=reason, html=html, block=block)
                return JsonResponse({'status': 201, 'content': tag.get_dict()})
            except:
                return JsonResponse({'status': 503, 'msg': '添加失败'})
        # 删除
        elif tid is not None and (grade, reason, html) != (None, None, None):
            try:
                tag = ReportTag.objects.get(tid=tid)
                tag.html = html if html is not None else tag.html
                tag.grade = grade if grade is not None else tag.grade
                tag.reason = reason if reason is not None else tag.reason

                tag.save()
                return JsonResponse({'status': 201, 'content': tag.get_dict()})
            except:
                return JsonResponse({'status': 503, 'msg': '删除失败'})
        elif tid is not None:
            try:
                tag = ReportTag.objects.get(tid=tid)
                tag.delete()
                return JsonResponse({'status': 201})
            except:
                return JsonResponse({'status': 503, 'msg': '删除失败'})
    return JsonResponse({'status': 503, 'msg': '删除失败'})


@login_required
def opt_institute(request):
    user = request.user
    if not user.is_superuser or request.method != 'POST':
        return JsonResponse({'status': 505, 'msg': '权限不足'})
    iid = request.POST.get('iid')
    name = request.POST.get('name')
    try:
        if name is not None:
            ins = Institute(name=name)
            ins.save()
            return JsonResponse({'status':201, 'content':ins.get_dict()})
        elif iid is not None:
            ins = Institute.objects.get(iid=iid)
            ins.delete()
            return JsonResponse({'status':201})
    except:
        return JsonResponse({'status': 503, 'msg': '修改失败'})


@login_required
def opt_major(request):
    user = request.user
    if not user.is_superuser or request.method != 'POST':
        return JsonResponse({'status': 505, 'msg': '权限不足'})
    iid = request.POST.get('iid')
    mid = request.POST.get('mid')
    name = request.POST.get('name')
    try:
        if iid is not None:
            ins = Institute.objects.get(iid=iid)
            maj = ins.major.create(name=name)
            return JsonResponse({'status': 201, 'content': maj.get_dict()})
        elif mid is not None:
            maj = Major.objects.get(mid=mid)
            maj.delete()
            return JsonResponse({'status':201})
    except:
        return JsonResponse({'status': 503, 'msg': '修改失败'})


@login_required
def opt_class(request):
    user = request.user
    if not user.is_superuser or request.method != 'POST':
        return JsonResponse({'status': 505, 'msg': '权限不足'})
    cid = request.POST.get('cid')
    mid = request.POST.get('mid')
    name = request.POST.get('name')
    try:
        if mid is not None:
            maj = Major.objects.get(mid=mid)
            cla = maj.student_class.create(name=name)
            return JsonResponse({'status': 201, 'content': cla.get_dict()})
        elif cid is not None:
            cla = StudentClass.objects.get(cid=cid)
            cla.delete()
            return JsonResponse({'status':201})
    except:
        return JsonResponse({'status': 503, 'msg': '修改失败'})


@login_required
def submit_report(request):
    user = request.user.userBaseInfo
    if request.method == 'POST':
        rid = request.POST.get('rid', '')
        try:
            report = user.report.get(rid=rid)
            report.is_submit = True
            report.submit_time = datetime.datetime.now()
            report.is_corrected = False
            report.total_grades = 0
            report.save()
        except Exception,e:
            return JsonResponse({'status': 501, 'msg': '非法的rid'})
        return JsonResponse({'status':201})
    return JsonResponse({'status': 502, 'msg': '不支持的操作'})


@login_required
def push_back_report(request):
    user = request.user.userBaseInfo
    if request.method == 'POST':
        if user.group != 'teacher':
            return JsonResponse({'status':501,'msg':'权限不支持'})
        reason = request.POST.get('reason','')
        rid = request.POST.get('rid','')
        try:
            report = Report.objects.get(rid=rid)
            report.is_submit = False
            report.total_grades = 0
            report.is_corrected = False
            report.back_reason = reason
            report.save()
        except:
            return JsonResponse({'status': 503, 'msg': '不存在的rid'})
        try:
            utils.send_report_push_back_email(report)
        except:
            return JsonResponse({'status': 503, 'msg': '邮件发送失败'})
        return JsonResponse({'status':201})
    return JsonResponse({'status': 502, 'msg': '不支持的操作'})

@login_required
def save_data_table(request):
    user = request.user.userBaseInfo
    if request.method =='POST':
        try:
            rid = request.POST.get('rid', '')
            id = request.POST.get('id', '1')
            report = user.report.get(rid=rid)
            data_table = report.data_table.filter(did = id)
            if len(data_table) == 0:
                data_table = report.data_table.create(did=id)
            else:
                data_table = data_table[0]
            data_table.data = request.POST.get('data', '')
            data_table.name = request.POST.get('name', '未命名')
            data_table.col = request.POST.get('col','1')
            data_table.row = request.POST.get('row','1')
            data_table.save()
        except Exception,e:
            return JsonResponse({'status': 503, 'msg': '不存在的rid'})
        return JsonResponse({'status':201})
    return JsonResponse({'status': 502, 'msg': '不支持的操作'})

@login_required
def delete_data_table(request):
    user = request.user.userBaseInfo
    if request.method =='POST':
        try:
            rid = request.POST.get('rid', '')
            id = request.POST.get('id')
            report = user.report.get(rid=rid)
            data_table = report.data_table.filter(did=id)
            if len(data_table) == 0:
                return JsonResponse({'status':201})
            else:
                data_table.delete()
        except Exception,e:
            return JsonResponse({'status': 503, 'msg': '不存在的rid'})
        return JsonResponse({'status':201})
    return JsonResponse({'status': 502, 'msg': '不支持的操作'})