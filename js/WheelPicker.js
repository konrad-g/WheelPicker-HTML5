
function WheelPicker(id, size, elements, defPos, isInfinite, isReadOnly, label) {
    
    // Constants
    var SPEED = 0.3;
    var MAX_SCROLL_TIME = 1500;
    var Y_EASE_OUT_RATIO = 0.3;
    var TIME_EASE_OUT_RATIO = 0.3;
    var TOL_POS = 0.4;
    var POS_TOLERANCE = 0.02;
    var MAX_TIME_ACCELERATE = 200;
    
    var min = 0;
    var max = 0;
    
    // Public properties
    this.id = id;
    this.size = size;
    this.elements = elements;
    this.defPos = defPos;
    this.isInfinite = isInfinite;
    this.isReadOnly = isReadOnly;
    this.label = label;
    this.context = $(document.body);;
    
    this.onChange = function(){};
    
    var elementHeight = 0;
    var min = 0;
    var max = 0;
    
    this.setDefault = function() {
        
        this.id = "wheelPicker"
        this.size = new Rect(0, 0, 10, 10)
        this.elements = new Array();
        this.defPos = "";
        this.isInfinite = false;
        this.isReadOnly = false;
        this.context = $(document.body);
        
    }
    
    this.add = function() {
        
        var imgHtml = this.getHtml();
        $(this.context).append( imgHtml );
        
        // Generate global variables
        this.context = $('#' + this.id);
        
        max =  ((1 + TOL_POS) * elementHeight);
        min = - elementHeight * (this.elements.length - (2 - TOL_POS));
        
        this.scrollTo(this.defPos, false);
        
        this.bindEvents();
        //sthis.init();
        
    }
    
    this.bindEvents = function() {
        
        var wheel = this;
        $( "#" + wheel.id ).off('vmousedown', '.dwwo' ).on('vmousedown', '.dwwo' ,function(e) {
            console.log('Mouse down');
            wheel.mouseDown(wheel, e);
        });
        
    }
    
    this.mouseDown = function(wheel, e){
       
        if(!wheel.isReadOnly) {
            wheel.currentTop = $('ul', this.context).css('top').replace(/[^-\d\.]/g, '');
            
            var date = new Date();
            wheel.initTime = date.getTime(); 
                    
            wheel.initY = e.pageY;
            //this.initY = e.pageY;
            
            // Stop all animations
            $('ul', wheel.context).stop();
            
            $( document.body ).off('vmousemove' ).on('vmousemove' ,function(e) {
                wheel.mouseMove(wheel, e);
            });

            $( document.body ).off('vmouseup' ).on('vmouseup' ,function(e) {
                wheel.mouseUp(wheel, e);
            });
            
        }
       
       
        
    }
    
    this.mouseMove = function(wheel, e){
        
        
        var top =  parseFloat(-(wheel.initY - e.pageY)) + parseFloat(wheel.currentTop);
        console.log('move: ' + top);
        
        // Check boundries
        if(!this.isInfinite) {
            if(top > max) {
                top = max;
            }
            if(top < min) {
                top = min;
            }
            
        }
        
        // Stop all animations
        $('ul', wheel.context).stop();
        
        $('ul', this.context).css('top', top);
        
    }
    
    this.mouseUp = function(wheel, e){
        
        $( document.body ).off( 'vmouseup' );
        $( document.body ).off( 'vmousemove' );
        
        var date = new Date();
        var timeDiff =  date.getTime() - wheel.initTime; 
        
        var pos = this.getPos();
        
        var lengthMoved = parseFloat(-(wheel.initY - e.pageY));
        console.log("length moved: " + lengthMoved);
        
        
        var addditionalPos = 0;
        
        if(timeDiff < MAX_TIME_ACCELERATE) {
            addditionalPos = -Math.round( (2*lengthMoved)/timeDiff );
        }
        
        this.scrollToNearest(addditionalPos);
        
    }
    
    this.scrollTo = function(pos, animate) {
        
        if(animate) {
            
            if(this.isInfinite) {
                // Set always in the middle segment
                this.animWheelTo(this.elements.length + pos);
            } else {
                this.animWheelTo(pos);
            }
            
        } else {
            // Get current position
            if(this.isInfinite) {
                // Set always in the middle segment
                this.setWheelTo(this.elements.length + pos);
            } else {
                this.setWheelTo(pos);
            }
        }
        
    }
    
    this.animWheelTo = function(posAbs) {
        
        var y = - ((posAbs-1) * elementHeight);
        var scrollToNearest = false;
        
        if(!this.isInfinite) {
            if(y > max) {
                y = max;
                scrollToNearest = true;
            }
            if(y < min) {
                y = min;
                scrollToNearest = true;
            }
        }
        
        var lengthToMove = y - $('ul', this.context).css('top').replace(/[^-\d\.]/g, '');
        
        var yEaseOut = lengthToMove * Y_EASE_OUT_RATIO;
        var time = Math.abs(lengthToMove / SPEED);
        
        if(time > MAX_SCROLL_TIME) {
            time = MAX_SCROLL_TIME;
        }
        
        var timeEase = time * TIME_EASE_OUT_RATIO;
        
        var wheel  = this;
        
        $('ul', wheel.context).stop().animate({ top : (y - yEaseOut) }, timeEase, 'easeInCirc', function () {

            //animate main body of the animation
            $('ul', wheel.context).animate({ top : y  }, time - timeEase, 'linear', function () {

                //animate the last easing
                $('ul', wheel.context).animate({ top :(y) }, timeEase, 'easeOutCirc', function() {
                    
                    if(scrollToNearest) {
                        wheel.scrollToNearest();
                    } else {
                        wheel.onChange(wheel);
                    }
                });
            });
        });
        
    }
    
    this.setWheelTo = function(pos) {
        
        var y = - ((pos-1) * elementHeight);
        
        // Always set to center segment
        if(this.isInfinite) {
            y += this.elements.length * elementHeight;
        }
        
        $('ul', this.context).css('top', y);
        
    }
    
    
    
/*
function Scroller(elm, settings) {
        var this = this,
            e = elm,
            elm = $(e),
            theme,
            lang,
            s = $.extend({}, defaults),
            m,
            dw,
            warr = [],
            iv = {},
            input = elm.is('input'),
            visible = false;
*/
        // Private functions


        this.generateWheelItems = function() {
            
            var html = '';
            
            console.log(this.size.height + "/" + this.elements);
            
            // Get single item height
            elementHeight = this.size.height / 3;
        
            var segments = 1;
            if(this.isInfinite) {
                segments = 3;
            }
            
            while(segments > 0) {
                
                for (var j in this.elements) {
                    html += '<li class="wheelItem" data-val="' + j + '" style="height:' + elementHeight + 'px;line-height:' + elementHeight + 'px;">' + this.elements[j] + '</li>';
                }
                
                segments--;
            }
            
            return html;
        }

       
        /**
        * Enables the scroller and the associated input.
        */
        this.enable = function () {
            this.isReadOnly = false;
        }

        /**
        * Disables the scroller and the associated input.
        */
        this.disable = function () {
            this.isReadOnly = true;
        }

        this.setOnChangeListener = function(onChange) {
            
            this.onChange = onChange;
            
        }



        /**
        * Hides the scroller instance.
        */
        this.hide = function (prevAnim) {
            
            $(this.id).hide();
            
        }

        this.scrollToNearest = function (additionalPos) {
            var y = $('ul', this.context).css('top').replace(/[^-\d\.]/g, '');;
            
            if(isNaN(y)) {
                this.animWheelTo(this.defPos);
                return;
            }
            
            if(additionalPos == null) {
                additionalPos = 0;
            }

            // Find if wheel needs to be set 
            
            var valueModulus = y % elementHeight;
            //if(valueModulus > POS_TOLERANCE) {
                var nearestPos = this.getPos() + additionalPos;
                
                this.animWheelTo(nearestPos);
            //}
        }
        
        this.getPos = function() {
            
            var y = $('ul', this.context ).css('top').replace(/[^-\d\.]/g, '');
            
            if(isNaN(y)) {
                return this.defPos;
            }
            
            // Check boundries
            if(!this.isInfinite) {

                var maxPos = elementHeight;
                var minPos = -elementHeight * (this.elements.length-2 );
                
                if(y < minPos) {
                    y = minPos;
                }
                if(y > maxPos) {
                    y = maxPos;
                }

            }
            
            var value = -Math.round( y / elementHeight );
            value += 1;
            console.log('Pos:' + value);
            
            return value;
        }
        
        this.getValue = function() {
            
            var pos = this.getPos();
            var value = this.elements[pos];
            return value;
            
        }
        
        this.getHtml = function() {
            
            // Create wheels containers
            var theme = 'dw';
            var wheelNr = 0;
            var html = '<div id ="' + this.id + '" class="dw-inline' + '">' +  '<div class="dw dwbg dwi"><div class="dwwr">';

            html += '<div class="dwc' + ' dwsc' + '"><div class="dwwc dwrc"><table cellpadding="0" cellspacing="0"><tr>';
            html += '<td><div class="dwwl dwrc dwwl' + wheelNr + '">'  + '<div class="dwl">' + this.label + '</div><div class="dww dwrc" style="height:' + this.size.height + 'px;min-width:' + this.size.width + 'px;"><ul>';
            
            // Create wheels
                
            // Create wheel values
            html += this.generateWheelItems();
                
            html += '</ul><div class="dwwo"></div></div><div class="dwwol"></div></div></td>';
            html += '</tr></table></div></div>';

                
            html +=  '<div class="dwcc"></div>' + '</div></div></div>';
            
            return html;
            
        }

      
        /**
        * Scroller initialization.
        */
        this.init = function () {

            //m = Math.floor(s.rows / 2);

            $(document.body).unbind('.dw');

            if ($(document.body).data('dwro') !== undefined)
                this.readOnly = bool(elm.data('dwro'));

            //if (visible)
            //    this.hide();

            this.show();
            
        }

        this.val = null;

        //this.init(settings);
    }

    function testProps(props) {
        for (var i in props)
            if (mod[props[i]] !== undefined)
                return true;
        return false;
    }

    function testPrefix() {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'];
        for (var p in prefixes) {
            if (testProps([prefixes[p] + 'Transform']))
                return '-' + prefixes[p].toLowerCase();
        }
        return '';
    }

    function getInst(e) {
        return scrollers[e.id];
    }

    function getY(e) {
        return e.changedTouches || (e.originalEvent && e.originalEvent.changedTouches) ? (e.originalEvent ? e.originalEvent.changedTouches[0].pageY : e.changedTouches[0].pageY) : e.pageY;

    }

    function bool(v) {
        return (v === true || v == 'true');
    }

    function calc(t, val, dir, anim, orig) {
        val = val > max ? max : val;
        val = val < min ? min : val;

        var cell = $('li', t).eq(val);

        // Set selected scroller value
        this.elements[index] = cell.attr('data-val');

        // Validate
        this.validate(anim ? (val == orig ? 0.1 : Math.abs((val - orig) * 0.1)) : 0, orig, index, dir);
    }