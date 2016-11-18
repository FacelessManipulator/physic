// "<link href=\"" + '/static/jmeditor/' + "mathquill-0.9.1/mathquill.css\" rel=\"stylesheet\" type=\"text/css\" />" +
// "<script type=\"text/javascript\" src=\"" + '/static/jmeditor/'  + "jquery-1.8.3.min.js\"></script>" +
//"<script type=\"text/javascript\" src=\"" + '/static/jmeditor/'  + "mathquill-0.9.1/mathquill.min.js\"></script>" +

//依赖于上面三个文件

var jmeMath = [
		[
			"{/}frac{}{}","^{}/_{}","x^{}","x_{}","x^{}_{}","{/}bar{}","{/}sqrt{}","{/}nthroot{}{}",
			"{/}sum^{}_{n=}","{/}sum","{/}log_{}","{/}ln","{/}int_{}^{}","{/}oint_{}^{}"
		],
		[
			"{/}alpha","{/}beta","{/}gamma","{/}delta","{/}varepsilon","{/}varphi","{/}lambda","{/}mu",
			"{/}rho","{/}sigma","{/}omega","{/}Gamma","{/}Delta","{/}Theta","{/}Lambda","{/}Xi",
			"{/}Pi","{/}Sigma","{/}Upsilon","{/}Phi","{/}Psi","{/}Omega"
		],
		[
			"+","-","{/}pm","{/}times","{/}ast","{/}div","/","{/}bigtriangleup",
			"=","{/}ne","{/}approx",">","<","{/}ge","{/}le","{/}infty",
			"{/}cap","{/}cup","{/}because","{/}therefore","{/}subset","{/}supset","{/}subseteq","{/}supseteq",
			"{/}nsubseteq","{/}nsupseteq","{/}in","{/}ni","{/}notin","{/}mapsto","{/}leftarrow","{/}rightarrow",
			"{/}Leftarrow","{/}Rightarrow","{/}leftrightarrow","{/}Leftrightarrow"
		]
];

function mathHtml(obj){
		var cols = 8;//一行放几个
		var slidLen = 34;//每个图标的宽或高
		var html="<div class='mathIcon'>";
		for(var i = 0 ; i < obj.count ; i ++){
			html += "<li onclick=\"insert('" + jmeMath[obj.groupid][i] + "', '"+obj.des+"')\" style=\"background-position:-" + (obj.x + Math.floor(i%8)*slidLen) + "px -" + (obj.y + Math.floor(i/8)*slidLen) + "px;\"></li>";
		}
		html += "</div>";
		return html;
}
function insert(q,id){
		$("#"+id+"-editor").focus().mathquill("write", q.replace("{/}","\\"));
}

function mathDialogInit(id){
		//公式定义
		$("#"+id+"-formula").html(mathHtml({
				groupid:0,
				x:0,
				y:272,
				count:14,
				des: id
			}));
		$("#"+id+"-symbol").html(mathHtml({
				groupid:2,
				x:0,
				y:0,
				count:36,
				des: id
			}));
		$("#"+id+"-letter").html(mathHtml({
				groupid:1,
				x:0,
				y:170,
				count:22,
				des: id
		}));
		//公式编辑框
		$("#"+id+"-editor").html("").mathquill('editable').mathquill('write', "");
}