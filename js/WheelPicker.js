/**@author Konrad Gadzinowski <kgadzinowski@gmail.com>
 * 
 * @param {type} id
 * @param {type} size
 * @param {type} elements
 * @param {type} defPos
 * @param {type} isInfinite
 * @param {type} isReadOnly
 * @param {type} label
 * @returns {WheelPicker}
 */
function WheelPicker(id, size, elements, defPos, isInfinite, isReadOnly, label) {
    
    // Constants
    var SPEED = 0.3;
    var MAX_SCROLL_TIME = 1500;
    var Y_EASE_OUT_RATIO = 0.3;
    var TIME_EASE_OUT_RATIO = 0.3;
    var TOL_POS = 0.4;
    var POS_TOLERANCE = 0.02;
    var MAX_TIME_ACCELERATE = 200;
    var INFINITE_MIN_SEGMENTS= 3;
    var INFINITE_MIN_ELEMENTS = 30;
    
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
    
    this.segments = INFINITE_MIN_SEGMENTS;
    
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
        
        // Get number of segments in infinite case
        if(this.isInfinite) {
            
            this.segments = Math.ceil( INFINITE_MIN_ELEMENTS / this.elements.length );
            
            if(this.segments < INFINITE_MIN_SEGMENTS) {
                this.segments = INFINITE_MIN_SEGMENTS
            }
        }
        
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
        
        wheel.currentTop = $('ul', this.context).css('top').replace(/[^-\d\.]/g, '');
        var top =  parseFloat(-(wheel.initY - e.pageY)) + parseFloat(wheel.currentTop);
        wheel.initY = e.pageY;
        
        // Check boundries
        if(!this.isInfinite) {
            if(top > max) {
                top = max;
            }
            if(top < min) {
                top = min;
            }
            
        } else {
            
            wheel.moveToMiddleSegment(top, wheel);
            return;
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
            this.setWheelTo(pos);
        }
        
    }
    
    this.scrollBy = function(nmb, animate) {
        
        var wheel = this;
        
        var currentPos = this.getPos();
        var newPos = currentPos + nmb;
        
        if(this.isInfinite) {
           
           //Reduce new position to standard size
           var segmentsToPass = Math.abs( Math.floor(newPos / this.elements.length));
           newPos = Math.abs(newPos);
           newPos -= segmentsToPass * this.elements.length;
           
           
           if(animate) {
                wheel.currentTop = $('ul', wheel.context).css('top').replace(/[^-\d\.]/g, '');
                this.animWheelInfTo(newPos, segmentsToPass, wheel);
           } else {
               this.setWheelTo(newPos);
           }
        
        } else {
            
           if(newPos < 0) {
               newPos = 0;
           } 
           if(newPos > (this.elements.length -1) ) {
               newPos = this.elements.length -1;
           } 
            
           if(animate) {
               this.animWheelTo(newPos);
           } else {
               this.setWheelTo(newPos);
           }
            
        }
        
    }
    
    this.moveToMiddleSegment = function(top, wheel) {
        
        top = parseFloat(top);
        
        // Put user back to center segment while scrolling manually
        var middleSegment = Math.floor(wheel.segments / 2);

        var maxCenter = elementHeight - (middleSegment * wheel.elements.length * elementHeight);
        var minCenter = - elementHeight * (wheel.elements.length - 2) - (middleSegment * wheel.elements.length * elementHeight);

        while(top > maxCenter) {
            top -=  (wheel.elements.length  ) * elementHeight; 
            wheel.currentTop = top;
        }
        while(top < minCenter) {
            top += (wheel.elements.length  ) * elementHeight;
            wheel.currentTop = top;
        }

        console.log("Top set: " + minCenter + ", "+ top + ", " + maxCenter);
        
        // Stop all animations
        $('ul', wheel.context).stop();
        $('ul', wheel.context).css('top', top);
        
    }
    
    /** This widget supports only rotating downwards using fixed number of scrolled elements
     * TODO: Optimize scrolling so it won't generate so many elements, but can reuse it instead + add rotation in oposite direction
     * @param {type} posAbs
     * @param {type} segmentsToPass
     * @param {type} wheel
     * @returns {undefined}
     */
    this.animWheelInfTo = function(posAbs, segmentsToPass, wheel) {
        
        segmentsToPass = Math.abs(segmentsToPass);
        //console.log('Segments to pass: ' + segmentsToPass + ",  posAbs:" + posAbs);
        
        var currentY = wheel.currentTop;
        
        // Move to middle segment
        wheel.moveToMiddleSegment(currentY, wheel);
        

        if(segmentsToPass > 0) {

            // Add all lacking segments and then rotate wheel
            var wheels = "";
            
            // Set final value
            posAbs += this.elements.length * segmentsToPass;
            posAbs = Math.abs(posAbs);
            
            while(segmentsToPass > 0) {
                wheels += this.generateWheelItems('tmpEntries');
                segmentsToPass--;
            }
            
            //Add new wheels
            $('ul', this.context).append( wheels );
            
            wheel.animWheelTo(posAbs, function() {
                // Clean all temporary created elements
               $('.tmpEntries').remove();
            });

            //Rotate wheel by all numbers
        } else {
            // Go to standart position 
            posAbs = Math.abs(posAbs);
            wheel.animWheelTo(posAbs);
        }
            
        
        
        
    }
    
    this.animWheelTo = function(posAbs, onFinish) {
        
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
                        
                        if(onFinish != null) {
                            onFinish();
                        }
                        
                        if(wheel.isInfinite) {
                            wheel.moveToMiddleSegment(y, wheel);
                        }
                    }
                });
            });
        });
        
        
    }
    
    this.setWheelTo = function(pos) {
        
        // Always set to center segment
        if(this.isInfinite) {
            var middleSegment = Math.floor(this.segments / 2);
            var pos = (middleSegment * this.elements.length ) + pos;
        }
        
        var y = - ((pos-1) * elementHeight);
        
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


        this.generateWheelItems = function(className) {
            
            var html = '';
            
            console.log(this.size.height + "/" + this.elements);
            
            // Get single item height
            elementHeight = this.size.height / 3;
        
            var segments = 1;
            if(this.isInfinite) {
                segments = this.segments;
            }
            
            if(className == null) {
                className = '';
            } else {
                className = ' ' + className;
            }
            
            while(segments > 0) {
                
                for (var j in this.elements) {
                    html += '<li class="wheelItem' + className + '" data-val="' + j + '" style="height:' + elementHeight + 'px;line-height:' + elementHeight + 'px;">' + this.elements[j] + '</li>';
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
            
            if(isInfinite) {
                
                // Include other segments
                var otherSegments = Math.floor( pos / this.elements.length );
                pos -= otherSegments * this.elements.length;
                
            }
            
            var value = this.elements[pos];
            
            return value;
            
        }
        
        this.getHtml = function() {
            
            // Create wheels containers
            var theme = 'dw';
            var wheelNr = 0;
            var html = '<div id ="' + this.id + '" class="dw-inline' + '" style="position:absolute; top:' + size.y +'px; left:' + size.x +'px;">' +  '<div class="dw dwbg dwi"><div class="dwwr">';

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