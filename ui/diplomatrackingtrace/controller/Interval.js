sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/IntervalTrigger"
], function(Control, IntervalTrigger) {
	return Control.extend("diploma.tracking.trace.controller.Interval", {
		metadata: {
			properties: {
				interval: {type: "integer", defaultValue: 1000},
				enabled: {type: "boolean", defaultValue: false}
			},
			events: {
				trigger: {}
			}
		},
		
		_trigger: null,
		
		init: function() {
			this._trigger = new IntervalTrigger(this.getInterval() || 1000);
			this._trigger.addListener(function(){
				if (this.getEnabled()) {
					this.fireEvent("trigger");
				}
			}, this);
		},
		
		setInterval: function(iInterval) {
			this.setProperty("interval", iInterval);
			this._trigger.setInterval(iInterval);
		}
	});
});