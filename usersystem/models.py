# coding=utf-8
from __future__ import unicode_literals
from django.db import models
import hashlib, datetime, os
from django.utils.crypto import get_random_string

def _image_upload_path_(instance, filename):
    return r'users/' + instance.user.username + r'/' + get_random_string() + '.' + filename.split('.')[-1]


def report_image_upload_path_(instance, filename):
    return r'users/' + instance.report.user.user.username + r'/report/' + str(instance.report.rid) + "/images/" \
           + get_random_string() + '.' + filename.split('.')[-1]


def report_file_upload_path_(instance, filename):
    return r'users/' + instance.report.user.user.username + r'/report/' + str(instance.report.rid) + "/files/" \
           + get_random_string() + '.' + filename.split('.')[-1]

def website_file_upload_path(instance, filename):
    return os.path.join('website', get_random_string() + '.' + filename.split('.')[-1])


class WebsiteConfig(models.Model):
    # APP常量
    weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', ]
    time_format = "%Y-%m-%d"
    dirty_dic_values = ['', None]
    # APP权限配置
    website_allow_change = ['default_password', 'sitename', 'start_week_day',
                            'report_editing_day', 'WebsiteName', 'WebsiteEmailAccount',
                            'WebsiteEmailPassword', ]
    user_settings_allow_super_change = ['name', 'email', 'phone', 'major_and_class']
    user_settings_allow_user_change = ['phone', 'major_and_class']
    report_content_editable = ['objective', 'process', 'instrument', 'principle',
                               'data_processing', 'thinking', 'raw_data']
    # APP变量设置
    default_password = models.CharField(max_length=128, default='123456')
    sitename = models.CharField(max_length=128, default='example.com:8001')
    start_week_day = models.DateField(default=datetime.date(2016, 9, 4))
    report_editing_day = models.IntegerField(default=7)
    default_head_img = models.ImageField(upload_to=website_file_upload_path)
    welcome_word = models.CharField(max_length=1024, default='')
    show_extra_block = models.BooleanField(default=True)

    def get_weekdays(self, date):
        if isinstance(date, (unicode,str)):
            date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
        delta = (date - self.start_week_day).days
        return "第%d周/%s"% (delta//7 + 1, self.weekday[delta % 7])

    def get_end_date(self, date):
        if isinstance(date, (unicode,str)):
            date = datetime.datetime.strptime(date, "%Y-%m-%d")
        end_date = date + datetime.timedelta(self.report_editing_day)

        return str(end_date)

    def get_dict(self):
        return {'default_password': self.default_password,
                'sitename': self.sitename,
                'welcome_word': self.welcome_word,
                'start_week_day': self.start_week_day,
                'report_editing_day': self.report_editing_day,
                'default_head_img':  '/static/images/head-img-default.jpg' if self.default_head_img._file is None else self.default_head_img.url,
                'report_tags': [tag.get_dict() for tag in self.tag.all()],
                'show_extra_block':self.show_extra_block,
                'institute': [ins.get_dict() for ins in Institute.objects.all()]}


class Institute(models.Model):
    iid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)

    def get_dict(self):
        return {
            'iid': self.iid,
            'name': self.name,
            'major': [major.get_dict() for major in self.major.all()],
        }


class Major(models.Model):
    mid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    institute = models.ForeignKey('Institute', related_name='major', on_delete=models.CASCADE)

    def get_dict(self):
        return {
            'mid': self.mid,
            'name': self.name,
            'student_class': [student_class.get_dict() for student_class in self.student_class.all()],
        }


class StudentClass(models.Model):
    cid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    major = models.ForeignKey('Major', related_name='student_class', on_delete=models.CASCADE)

    def get_dict(self):
        return {
            'cid': self.cid,
            'name': self.name,
        }


# Create your models here.
class UserBaseInfo(models.Model):
    user = models.OneToOneField('auth.User', related_name='userBaseInfo', on_delete=models.CASCADE)
    student_class = models.ForeignKey('StudentClass', related_name='user', on_delete=models.SET_NULL, blank=True, null=True)
    experiment = models.ManyToManyField('experiment.Experiment', related_name='user')
    created = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=128, default='anonymous')
    phone = models.CharField(max_length=64, default='')
    photo = models.ImageField(upload_to=_image_upload_path_, blank=True, null=True)
    group = models.CharField(max_length=64, default='student')
    address = models.CharField(max_length=1024, default='')
    is_email_active = models.BooleanField(default=False)
    is_account_active = models.BooleanField(default=False)
    major_and_class = models.CharField(max_length=1024, default='')

    class Meta:
        ordering = ('created',)

    def save(self, *args, **kwargs):
        super(UserBaseInfo, self).save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        try:
            self.photo.delete()
            self.user.delete()
        except Exception, e:
            print e.message
        super(UserBaseInfo, self).delete(using, keep_parents)

    def reset_password(self):
        Config = WebsiteConfig.objects.all()[0]
        self.user.set_password(hashlib.md5(Config.default_password).hexdigest())

    def set(self, **kwargs):
        [setattr(self, key, kwargs[key]) for key in kwargs if key in self.__dict__]
        self.save()

    def update(self, dic):
        [setattr(self, key, dic[key]) for key in dic if key in self.__dict__]
        self.save()

    def get_dict(self, simple=True):
        dic = {}
        #TODO: 这里可能有安全隐患,后期应避免向学生返回教师的username
        dic['username'] = self.user.username
        dic['email'] = self.user.email
        dic['name'] = self.name
        dic['phone'] = self.phone
        dic['created'] = str(self.created)
        dic['address'] = self.address
        dic['is_active'] = self.is_account_active
        dic['major_and_class'] = self.major_and_class
        if self.student_class is not None:
            dic['student_class'] = self.student_class.name
            dic['major'] = self.student_class.major.name
            dic['institute'] = self.student_class.major.institute.name
        else:
            dic['student_class'] = ''
            dic['major'] = ''
            dic['institute'] = ''
        dic['photo'] = '/static/images/head-img-default.jpg' if self.photo._file is None else self.photo.url
        if not simple:
            if self.group == 'teacher':
                experiment_set = self.experiment.all()
                experiments = [experiment.get_dict(simple=True) for experiment in experiment_set]
                dic['experiments'] = experiments
            elif self.group == 'student':
                experiment_set = self.experiment.all()
                experiments = [experiment.get_dict(simple=True) for experiment in experiment_set]
                dic['experiments'] = experiments
                report_set = self.report.all()
                reports = [report.get_dict() for report in report_set]
                dic['reports'] = reports
        return dic


class Report(models.Model):
    experiment = models.ForeignKey('experiment.Experiment', null=True, blank=True, related_name='report',
                                   on_delete=models.CASCADE)
    user = models.ForeignKey('UserBaseInfo', related_name='report', on_delete=models.CASCADE)
    rid = models.AutoField(primary_key=True)
    is_corrected = models.BooleanField(default=False)
    total_grades = models.IntegerField(default=0)
    raw_data = models.TextField(default='')
    objective = models.TextField(default='')
    process = models.TextField(default='')
    instrument = models.TextField(default='')
    principle = models.TextField(default='')
    data_processing = models.TextField(default='')
    thinking = models.TextField(default='')
    is_submit = models.BooleanField(default=False)
    submit_time = models.DateTimeField(auto_now_add=True)
    corrected_time = models.DateTimeField(auto_now_add=True)
    back_reason = models.TextField(default='')

    def get_dict(self, simple=True):
        LOCAL_TIME_DELTA = datetime.timedelta(hours=8)
        dic = {}
        dic['rid'] = self.rid
        dic['is_corrected'] = self.is_corrected
        dic['total_grades'] = self.total_grades
        dic['is_submit'] = self.is_submit
        try:
            dic['experiment'] = self.experiment.get_dict(simple=False)
            dic['username'] = self.user.user.username
            dic['experiment_name'] = self.experiment.base.name
            dic['name'] = self.user.name
            dic['closed'] = not self.experiment.base.is_active or \
            dic['experiment'].get('end_date', '2050-01-01') < str(datetime.date.today())
            dic['submit_time'] = (self.submit_time+LOCAL_TIME_DELTA).strftime('%Y-%m-%d %H:%M')
            dic['corrected_time'] = (self.corrected_time+LOCAL_TIME_DELTA).strftime('%Y-%m-%d %H:%M')
        except:
            pass
        if not simple:
            dic['objective'] = {'data':self.objective}
            dic['process'] = {'data':self.process}
            dic['instrument'] = {'data':self.instrument}
            dic['principle'] = {'data':self.principle}
            dic['data_processing'] = {'data':self.data_processing}
            dic['thinking'] = {'data':self.thinking}
            dic['raw_data'] = {'data':self.raw_data}
            dic['back_reason'] = self.back_reason
            try:
                dic['user'] = self.user.get_dict()
                teacher = self.experiment.user.filter(group='teacher')[0]
                dic['teacher_name'] = teacher.name
                dic['teacher_photo'] = '/static/images/head-img-default.jpg' if teacher.photo._file is None else teacher.photo.url
                dic['teacher_email'] = teacher.user.email
                student = self.user
                dic['student_name'] = student.name
                dic['student_photo'] = '/static/images/head-img-default.jpg' if student.photo._file is None else student.photo.url
                dic['student_email'] = student.user.email
                dic['student_phone'] = student.phone
                dic['attach_files'] = [attach_file.get_dict() for attach_file in self.file.all()]
                dic['tags'] = [tag.get_dict() for tag in self.tag.all()]
                data = {}
                maxid = 0
                table_id = []
                for table in self.data_table.all():
                    data[table.did] = table.get_dict()
                    maxid = table.did if maxid < table.did else maxid
                    table_id.append(table.did)
                data['maxID'] = maxid
                data['tables'] = table_id
                dic['data'] = data
            except:
                pass
        else:
            pass
        return dic

    def delete(self, using=None, keep_parents=False):
        super(Report, self).delete(using, keep_parents)


class Image(models.Model):
    report = models.ForeignKey('Report', related_name='image', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=report_image_upload_path_, blank=True, null=True)
    create_date = models.DateTimeField(auto_now_add=True)

    def delete(self, using=None, keep_parents=False):
        try:
            self.image.delete()
        except Exception, e:
            print e.message
        super(Image, self).delete(using, keep_parents)


class ReportTag(models.Model):
    tid = models.AutoField(primary_key=True)
    report = models.ForeignKey('Report', related_name='tag', on_delete=models.CASCADE, null=True, blank=True)
    config = models.ForeignKey('WebsiteConfig', related_name='tag', on_delete=models.CASCADE, null=True, blank=True)
    grade = models.IntegerField(default=0)
    reason = models.CharField(max_length=256, default='')
    html = models.TextField(default='')
    block = models.CharField(max_length=128, default='')

    def get_dict(self):
        return {'tid': self.tid, 'grade': self.grade, 'reason': self.reason,'block':self.block, 'html': self.html}


class AttachFile(models.Model):
    report = models.ForeignKey('Report', related_name='file', on_delete=models.CASCADE, null=True)
    news = models.ForeignKey('experiment.News', related_name='file', on_delete=models.CASCADE, null=True)
    attach_file = models.FileField(upload_to=report_file_upload_path_, blank=True, null=True)
    name = models.CharField(max_length=512, default='')

    def delete(self, using=None, keep_parents=False):
        try:
            self.attach_file.delete()
        except Exception, e:
            print e.message
        super(AttachFile, self).delete(using, keep_parents)

    def get_dict(self):
        dic = {}
        try:
            dic['fid'] = self.pk
            dic['name'] = self.name
            dic['url'] = self.attach_file.url
        except:
            pass
        return dic

class DataTable(models.Model):
    report = models.ForeignKey('Report', related_name='data_table', on_delete=models.CASCADE)
    did = models.IntegerField()
    data = models.TextField(null=True)
    col = models.IntegerField(default=1)
    row = models.IntegerField(default=1)
    name = models.CharField(max_length=128,default='未命名')

    def get_dict(self):
        dic = {}
        try:
            dic['id'] = self.did
            dic['data'] = self.data if self.data is not None else ''
            dic['col'] = self.col
            dic['row'] = self.row
            dic['name'] = self.name
            dic['rid'] = self.report.rid
        except:
            pass
        return dic