var Common = function() {
    var self = this;
    self.init = function(){
        console.log("Initialize!");
    }
    self.init();
}
var common = new Common();

var IndexController = function(){
    var self = this;
    self.init = function(){
        console.log("indexController Initialized!");
    }
    self.init();
}
var idxCtl = new IndexController();
