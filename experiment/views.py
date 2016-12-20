#coding=utf8
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http.response import JsonResponse
from django.contrib.auth.models import User
from usersystem.models import WebsiteConfig, UserBaseInfo
# Create your views here.
from models import Experiment, BaseExperiment

@login_required
def index(request):
    user = request.user.userBaseInfo
    Config = WebsiteConfig.objects.all()[0]
    if not user.user.is_active:
        return redirect('/login')
    if user.group == 'student':
        return render(request, 'experiment/list.html', context={'User': user,  'Config': Config.get_dict()})
    if user.group == 'admin':
        return render(request, 'experiment/admin.html', context={'User': user,  'Config': Config.get_dict()})
    if user.group == 'teacher':
        return render(request, 'experiment/teacher.html', context={'User': user, 'Config': Config.get_dict()})

@login_required
def receive_image(request):
    if request.method == 'POST':
        user = request.user.userBaseInfo
        report_id = request.POST.get('report_id', '')
        image = request.FILES.get('file')
        if image is not None:
            try:
                report = user.report_set.get(rid=report_id)
                img = report.image_set.create(image=image)
                return JsonResponse({'status': 201, 'url': img.url})
            except:
                return JsonResponse({'status': 500})
        else:
            return JsonResponse({'status': 401})


@login_required
def get_all_experiment(request):
    try:
        bases = BaseExperiment.objects.filter(is_active=True)
        experiments = []
        [experiments.extend(base.experience.all()) for base in bases]
        return JsonResponse({'status': 201, 'content': [exp.get_dict(simple=False) for exp in experiments if exp is not None]})
    except:
        return JsonResponse({'status': 500})


@login_required
def get_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        bid = request.GET.get('bid')
        eid = request.GET.get('eid')
        if bid is not None:
            pass
        elif eid is not None:
            pass
        else:
            experiments = BaseExperiment.objects.all()
            experiments = [experiment.get_dict(simple=False) for experiment in experiments]
            return JsonResponse({'status': 201, 'content': {'experiment': experiments}})
    else:
        eid = request.GET.get('eid')
        if eid is not None:
            try:
                experiment = Experiment.objects.get(eid=eid)
                return JsonResponse({'status': 201, 'content': experiment.get_dict(False, True)})
            except:
                return JsonResponse({'status': 500})
        experiments = user.experiment.all()
        experiments = [experiment.get_dict(simple=False) for experiment in experiments]
        return JsonResponse({'status': 201, 'content': experiments})


@login_required
def get_sub_experiment(request):
    if request.user.is_superuser:
        eid = request.GET.get('eid')
        if eid is None:
            experiments = Experiment.objects.all()
            experiments = [experiment.get_dict(simple=False) for experiment in experiments]
            return JsonResponse({'status': 201, 'content': experiments})
        else:
            try:
                experiment = Experiment.objects.get(eid=eid)
                return JsonResponse({'status': 201, 'content': experiment.get_dict(False, True)})
            except:
                return JsonResponse({'status': 500})
    return JsonResponse({'status': 501, 'msg': '权限不足'})


@login_required
def add_base_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            name = request.POST.get('name', '')
            title = request.POST.get('title', '')
            start_time = request.POST.get('start_time')
            type = request.POST.get('type', '')
            full = request.POST.get('full', 100)
            if BaseExperiment.objects.filter(title=title).exists():
                return JsonResponse({'status': 506, 'msg': '实验号重复'})
            try:
                if start_time is None:
                    base = BaseExperiment(name=name, type=type, created_user=user.name, title=title, full=full)
                    base.save()
                else:
                    base = BaseExperiment(name=name, type=type, created_user=user.name, title=title, start_time=start_time)
                    base.save()
                return JsonResponse({'status': 201, 'msg': '添加成功', 'content':  base.get_dict(False)})
            except Exception,e:
                return JsonResponse({'status': 505, 'msg': '不支持的操作'})
    else:
        return JsonResponse({'status': 501, 'msg': '权限不足'})



@login_required
def modify_base_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            bid = request.POST.get('bid')
            title = request.POST.get('title','')
            name = request.POST.get('name','')
            type = request.POST.get('type','')
            start_time = request.POST.get('start_time')
            is_active = request.POST.get('is_active', '')
            full = request.POST.get('full')
            try:
                base = BaseExperiment.objects.get(bid=bid)
                base.name = name
                base.type = type
                base.title = title if title != '' else bid
                base.full = int(full) if full is not None else base.full
                base.is_active = True if is_active == 'true' else False
                if start_time is not None:
                    base.start_time = start_time
                base.save()
                return JsonResponse({'status': 201, 'msg': '修改成功'})
            except:
                return JsonResponse({'status': 505, 'msg': '修改失败'})
    else:
        return JsonResponse({'status': 501, 'msg': '权限不足'})


@login_required
def delete_base_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            bid = request.POST.get('bid')
            try:
                if bid is not None:
                    BaseExperiment.objects.get(bid=bid).delete()
                return JsonResponse({'status': 201, 'msg': '删除成功'})
            except:
                return JsonResponse({'status': 505, 'msg': '删除失败'})
    else:
        return JsonResponse({'status': 501, 'msg': '权限不足'})


@login_required
def add_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            bid = request.POST.get('bid')
            b_title = request.POST.get('b_title')
            classroom = request.POST.get('classroom', '')
            date = request.POST.get('date')
            time = request.POST.get('time', '')
            title = request.POST.get('title', '')
            teacher_name = request.POST.get('teacher_name', '')
            try:
                if bid is None:
                    if b_title != '':
                        base = BaseExperiment.objects.get(title=b_title)
                    else:
                        return JsonResponse({'status': 506, 'msg': '错误的实验号'})
                else:
                    base = BaseExperiment.objects.get(bid=bid)
                if base.experience.filter(title=title).exists():
                    return JsonResponse({'status': 506, 'msg': '相同实验下不能有重复节次号'})
                if date is None:
                    e = base.experience.create(classroom=classroom, time=time, title=title)
                else:
                    e = base.experience.create(classroom=classroom, time=time, date=date, title=title)
                if teacher_name != '':
                    teacher = UserBaseInfo.objects.filter(group='teacher').filter(name=teacher_name)
                    if len(teacher) == 1:
                        e.user.clear()
                        e.user.add(teacher[0])
                    elif len(teacher) > 1:
                        return JsonResponse({'status': 506, 'msg': '存在重名教师,请改为输入账号'})
                    else:
                        teacher = User.objects.filter(username=teacher_name)
                        if len(teacher) == 0:
                            return JsonResponse({'status': 506, 'msg': '该教师不存在','content': e.get_dict()})
                        else:
                            e.user.clear()
                            e.user.add(teacher[0].userBaseInfo)
                e.save()
                return JsonResponse({'status': 201, 'msg': '添加成功', 'content':  e.get_dict()})
            except Exception,e:
                return JsonResponse({'status': 505, 'msg': '不支持的操作'})
    else:
        return JsonResponse({'status': 501, 'msg': '权限不足'})

@login_required
def modify_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            eid = request.POST.get('eid')
            classroom = request.POST.get('classroom', '')
            date = request.POST.get('date')
            time = request.POST.get('time', '')
            teacher_name = request.POST.get('teacher_name', '')
            title = request.POST.get('title', '')
            try:
                exp = Experiment.objects.get(eid=eid)
                exp.name = classroom
                exp.time = time
                exp.title = title if title != '' else eid
                if date is not None:
                    exp.date = date
                exp.save()
                if teacher_name != '':
                    teacher = UserBaseInfo.objects.filter(group='teacher').filter(name=teacher_name)
                    if len(teacher) == 1:
                        exp.user.clear()
                        exp.user.add(teacher[0])
                    elif len(teacher) > 1:
                        return JsonResponse({'status': 506, 'msg': '存在重名教师,请改为输入账号'})
                    else:
                        teacher = User.objects.filter(username=teacher_name)
                        if len(teacher) == 0:
                            return JsonResponse({'status': 506, 'msg': '该教师不存在'})
                        else:
                            exp.user.clear()
                            exp.user.add(teacher[0].userBaseInfo)
                return JsonResponse({'status': 201, 'msg': '修改成功'})
            except:
                return JsonResponse({'status': 505, 'msg': '修改失败'})
    else:
        return JsonResponse({'status': 501, 'msg': '权限不足'})


@login_required
def delete_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            eid = request.POST.get('eid')
            try:
                if eid is not None:
                    Experiment.objects.get(eid=eid).delete()
                return JsonResponse({'status': 201, 'msg': '删除成功'})
            except:
                return JsonResponse({'status': 505, 'msg': '删除失败'})
    else:
        return JsonResponse({'status': 501, 'msg': '权限不足'})

@login_required
def user_add_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            b_title = request.POST.get('b_title', '')
            title = request.POST.get('title', '')
            eid = request.POST.get('eid')
            uid = request.POST.get('uid')
            try:
                if b_title != '' and title != '':
                    base = BaseExperiment.objects.filter(title=b_title)[0]
                    exp = base.experience.filter(title=title)[0]
                elif eid:
                    exp = Experiment.objects.get(eid=eid)
                else:
                    return JsonResponse({'status': 505, 'msg': '添加失败'})
                user = User.objects.get(username=uid).userBaseInfo
                if user.report.filter(experiment=exp).exists():
                    return JsonResponse({'status': 505, 'msg': '已存在'})
                user.experiment.add(exp)
                if user.group == 'student':
                    user.report.create(experiment=exp)
                return JsonResponse({'status': 201, 'msg': '添加成功', 'content': exp.get_dict(False)})
            except Exception,e:
                return JsonResponse({'status': 505, 'msg': '添加失败'})
    else:
        eid = request.POST.get('eid','')
        try:
            exp = Experiment.objects.get(eid=eid)
            if user.report.filter(experiment=exp).exists():
                return JsonResponse({'status': 505, 'msg': '已存在'})
            user.experiment.add(exp)
            if user.group == 'student':
                user.report.create(experiment=exp)
            return JsonResponse({'status': 201, 'msg': '添加成功'})
        except:
            return JsonResponse({'status': 505, 'msg': '添加失败'})
    return JsonResponse({'status': 501, 'msg': '权限不足'})

@login_required
def user_delete_experiment(request):
    user = request.user.userBaseInfo
    if user.user.is_superuser:
        if request.method == 'POST':
            #TODO: 可以分别通过报告号或者实验id来唯一区分实验
            eid = request.POST.get('eid')
            rid = request.POST.get('rid')
            uid = request.POST.get('uid')
            try:
                user = User.objects.get(username=uid).userBaseInfo
                if eid is not None:
                    exp = Experiment.objects.get(eid=eid)
                elif rid is not None:
                    exp = user.report.get(rid=rid).experiment
                else:
                    return JsonResponse({'status': 506, 'msg': '不存在的实验'})
                user.experiment.remove(exp)
                user.report.filter(experiment=exp).delete()
                return JsonResponse({'status': 201, 'msg': '删除成功'})
            except:
                return JsonResponse({'status': 505, 'msg': '删除失败'})
    else:
        eid = request.POST.get('eid','')
        try:
            exp = user.experiment.get(eid=eid)
            user.experiment.remove(exp)
            user.report.filter(experiment=exp).delete()
            return JsonResponse({'status': 201, 'msg': '删除成功'})
        except:
            return JsonResponse({'status': 501, 'msg':'不存在的课程'})
    return JsonResponse({'status': 501, 'msg': '权限不足'})