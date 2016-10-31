from __future__ import unicode_literals

from django.db import models
from django.utils import timezone
import datetime
from usersystem.models import WebsiteConfig


class BaseExperiment(models.Model):
    bid = models.AutoField(primary_key=True)
    title = models.CharField(max_length=128, default='')
    name = models.CharField(max_length=512)
    type = models.CharField(max_length=128)
    created_time = models.DateTimeField(auto_now_add=True)
    created_user = models.CharField(max_length=128)
    start_time = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=False)

    def get_dict(self, simple=True):
        dic = {}
        dic['bid'] = self.bid
        dic['title'] = self.title
        dic['name'] = self.name
        dic['type'] = self.type
        dic['is_active'] = self.is_active
        dic['created_time'] = str(self.created_time)
        dic['start_time'] = str(self.start_time)
        if not simple:
            dic['sub_class'] = [exp.get_dict() for exp in self.experience.all()]
        else:
            pass
        return dic


class Experiment(models.Model):
    eid = models.AutoField(primary_key=True)
    title = models.CharField(max_length=128, default='')
    base = models.ForeignKey('BaseExperiment', related_name='experience', on_delete=models.CASCADE)
    classroom = models.CharField(max_length=256, default='')
    date = models.DateField(null=True, blank=True)
    time = models.CharField(max_length=128, default='')

    def get_dict(self, simple=True, attachReport=False):
        dic = {}
        dic['eid'] = self.eid
        dic['title'] = self.title
        dic['b_title'] = self.base.title
        dic['classroom'] = self.classroom
        dic['name'] = self.base.name
        if self.date is not None:
            dic['date'] = self.date
            Config = WebsiteConfig.objects.all()[0]
            dic['end_date'] = Config.get_end_date(self.date)
            dic['closed'] = str(self.date) < str(datetime.date.today())
            dic['week'] = Config.get_weekdays(self.date) + '/' + self.time
        dic['time'] = self.time
        if not simple:
            dic['base'] = self.base.get_dict()
        if attachReport:
            report_set = self.report.all()
            reports = [report.get_dict() for report in report_set]
            dic['reports'] = reports
        else:
            pass
        return dic



