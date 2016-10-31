from rest_framework import serializers
from models import Snippet,LANGUAGE_CHOICES,STYLE_CHOICES
from models import userBaseInfo
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    #snippets = serializers.PrimaryKeyRelatedField(many=True, queryset=Snippet.objects.all())
    snippets = serializers.HyperlinkedRelatedField(many=True, view_name='snippet-detail', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'snippets','password')

class SnippetSerializer(serializers.Serializer):
    pk = serializers.IntegerField(read_only=True)
    owner = serializers.ReadOnlyField(source='owner.username')
    highlight = serializers.HyperlinkedIdentityField(view_name='snippet-highlight', format='html')
    title = serializers.CharField(required=True,allow_blank=True,max_length=100)
    code = serializers.CharField(style={'base_template':'textarea.html'})
    linenos = serializers.BooleanField(required=True)
    language = serializers.ChoiceField(choices=LANGUAGE_CHOICES,default='python')
    style = serializers.ChoiceField(choices=STYLE_CHOICES,default='friendly')

    def create(self, validated_data):
        return Snippet.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.code = validated_data.get('code', instance.code)
        instance.linenos = validated_data.get('linenos', instance.linenos)
        instance.language = validated_data.get('language', instance.language)
        instance.style = validated_data.get('style', instance.style)
        instance.save()
        return instance
    class Meta:
        model = Snippet
        fields = ('url', 'highlight', 'owner',
                  'title', 'code', 'linenos', 'language', 'style')
