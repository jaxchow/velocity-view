var Velocity=require('velocityjs');
var utils=require('./utils');

var fs=require('fs');
var path=require('path');

utils.mixin(Velocity.Compile.prototype, {
 	/**
 	 *  原型重写添加layout
 	 *
 	 */
 	_render: function(asts, contextId){

      var str = '';
      asts = asts || this.asts;

      if (contextId) {

        if (contextId !== this.condition && 
            utils.indexOf(contextId, this.conditions) === -1) {
          this.conditions.unshift(contextId);
        }

        this.condition = contextId;

      } else {
        this.condition = null;
      }

      utils.forEach(asts, function(ast){
        switch(ast.type) {
            case 'references':
            str += this.getReferences(ast, true);
            break;

            case 'set':
            this.setValue(ast);
            break;

            case 'break':
            this.setBreak = true;
            break;

            case 'macro_call':
                if(ast.id==='include'){
                  str += this.include(ast,this.context);
                }else if(ast.id==='parse'){
                  str += this.parse(ast,this.context);
                }else{
                   str += this.getMacro(ast);
                }

            break;

            case 'comment':
            break;
            default:
            str += typeof ast == 'string' ? ast : this.getBlock(ast);
            break;
        }

      }, this);

      return str;
    },
    /**
     * 包含引入文件，不进行语法解析
     * @param  {array} ast
     * @param  {object} context
     * @return {string}
     */
    include: function(ast, context) {
        var fs = require('fs'),
            html="",
            path = require('path');
        
        html= fs.readFileSync(path.join(context.path, ast.args[0].value), 'utf-8');
        return html;
    },
    /**
     * 导入文件，对文件内部语法编译解析
     * @param  {[type]} ast
     * @param  {[type]} context
     * @return {[type]}
     */
    parse: function(ast, context) {
        
        var data = this.include(ast, context),
            asts = Velocity.Parser.parse(data, context),
            compileHTML="";
        try{
			compileHTML=new Velocity.Compile(asts).render(context);
        }catch(err){
            compileHTML=err.toString();
        }
        return compileHTML;
    },
	/**
	 * 获取layout 值
	 *
	 *
	 *
	 */
    getLayoutVal:function(asts, defaultVal) {
        var value;
        asts.forEach(function(ast) {
            if (ast.type == "set") {

                if (ast.equal[0].id === "layout") {
                    value = ast.equal[1].value;
                }
            }
        });
        return value || defaultVal;
    }
});

Velocity.renderFile = function(file, context, macros, encoding) {
    var template = fs.readFileSync(file, encoding);
    return Velocity.render(template, context, macros);
}


Velocity.renderLayout = function(file, context, macros, velocityConfig) {
    var astsMacro=[];
    if(velocityConfig.macros){
        macros=fs.readFileSync(path.join(velocityConfig.resourceLoaderPath,velocityConfig.macros),velocityConfig.encoding);
        astsMacro=Velocity.Parser.parse(macros);
    }
    var processHTML = "";
    context['path'] = velocityConfig.resourceLoaderPath;
    try {
		processHTML = fs.readFileSync(file, velocityConfig.encoding);
    } catch (err) {
        throw new Error("can't not fund file!" + err);
        return err;
    }

    asts = Velocity.Parser.parse(processHTML, context)

    var complie = new Velocity.Compile(astsMacro.concat(asts));
    var layoutVal = complie.getLayoutVal(asts, velocityConfig.layoutUrl) || "layout.html";
    var layoutPath = path.join(velocityConfig.resourceLoaderPath || ".", layoutVal);
    var layoutTemplate = fs.readFileSync(layoutPath, velocityConfig.encoding);
    var layoutComplie = new Velocity.Compile(Velocity.Parser.parse(layoutTemplate));
    var pageHTML = complie.render(context, macros);

    context['screen_content'] = pageHTML;
    layoutComplie.addIgnoreEscpape('screen_content');
    return layoutComplie.render(context, macros);
}
Velocity.generatorToFile = function(file, dist, context, macros, encoding) {
    var template = Velocity.renderFile(file, context, macros, encoding);
    fs.writeFileSync(dist, template);
}


Velocity.__express = function(file, context, cb) {
	var self=this;
	console.log(this);
	cb(null, Velocity.renderLayout(file, context, null, {
        resourceLoaderPath: context.settings.views,
		macros:'/macro/common.vm',
        encoding: 'UTF-8'
    }));
}

module.exports = VelocityView=Velocity;
