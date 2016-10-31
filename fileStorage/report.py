#coding = utf-8
from pymongo import MongoClient
from bson.objectid import ObjectId
class report:
    def __init__(self):
        self.client = MongoClient('localhost',27017).report_database

    def insert(self,student,paper):
        student = self.client[student+'']
        inserted_id = student.insert_one(paper).inserted_id
        return str(inserted_id)

    def update(self,student,inserted_id,paper):
        student  = self.client[student+'']
        student.update({"_id":ObjectId(inserted_id)},{"$set":paper})
