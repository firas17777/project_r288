var settings = {
    particles: {
        length: 500,
        duration: 2,
        velocity: 100, 
        effect: -0.75, 
        size: 30, 
    },
};

(function(){
    var b=0;
    var c=["ms","moz","webkit","o"];
    for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){
        window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];
        window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]
    }
    if(!window.requestAnimationFrame){
        window.requestAnimationFrame=function(h,e){
            var d=new Date().getTime();
            var f=Math.max(0,16-(d-b));
            var g=window.setTimeout(function(){
                h(d+f)
            },f);
            b=d+f;
            return g
        }
    }
    if(!window.cancelAnimationFrame){
        window.cancelAnimationFrame=function(d){
            clearTimeout(d)
        }
    }
}());

var Point = (function() { 
    function Point(x, y) { 
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
    }   
    Point.prototype.clone = function() { 
        return new Point(this.x, this.y);
    };
    Point.prototype.length = function(length) { 
        if (typeof length == 'undefined')
            return Math.sqrt(this.x * this.x + this.y * this.y);
        this.normalize();
        this.x *= length;
        this.y *= length;
        return this;
    };
    Point.prototype.normalize = function() { 
        var length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    };

    return Point;
})();

var Particle = (function() { 
    function Particle() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
    }
    Particle.prototype.initialize = function(x, y, dx, dy) { 
        this.position.x = x;
        this.position.y = y;
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;
        this.age = 0;
    };
    Particle.prototype.update = function(deltaTime) { 
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.age += deltaTime;
    };
    Particle.prototype.draw = function(context, image) {
        function ease(t) { 
            return (--t) * t * t + 1;
        }
        var size = image.width * ease(this.age / settings.particles.duration);
        context.globalAlpha = 1 - this.age / settings.particles.duration;
        context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
    };

    return Particle;
})();

var ParticlePool = (function() { 
    var particles, firstActive = 0, firstFree = 0, duration = settings.particles.duration;

    function ParticlePool(length) { 
        particles = new Array(length);
        for (var i = 0; i < particles.length; i++)
            particles[i] = new Particle();
    }
    ParticlePool.prototype.add = function(x, y, dx, dy) { 
        particles[firstFree].initialize(x, y, dx, dy);
        firstFree++;
        if (firstFree == particles.length) { 
            firstFree = 0;
        }
        if (firstActive == firstFree) { 
            firstActive++;
        }
        if (firstActive == particles.length) { 
            firstActive = 0;
        }
    };
    ParticlePool.prototype.update = function(deltaTime) { 
        var i;
        if (firstActive < firstFree) {
            for (i = firstActive; i < firstFree; i++) { 
                particles[i].update(deltaTime);
            }
        }
        if (firstFree < firstActive) { 
            for (i = firstActive; i < particles.length; i++) { 
                particles[i].update(deltaTime);
            }
            for (i = 0; i < firstFree; i++) { 
                particles[i].update(deltaTime);
            }
        }
        while (particles[firstActive].age >= duration && firstActive != firstFree) { 
            firstActive++;
            if (firstActive == particles.length) { 
                firstActive = 0;
            }
        }
    };
    ParticlePool.prototype.draw = function(context, image) { 
        var i;
        if (firstActive < firstFree) { 
            for (i = firstActive; i < firstFree; i++) { 
                particles[i].draw(context, image);
            }
        }
        if (firstFree < firstActive) { 
            for (i = firstActive; i < particles.length; i++) { 
                particles[i].draw(context, image);
            }
            for (i = 0; i < firstFree; i++) { 
                particles[i].draw(context, image);
            }
        }
    };

    return ParticlePool;
})();

(function(canvas) {
    var context = canvas.getContext('2d'), 
        particles = new ParticlePool(settings.particles.length), 
        particleRate = settings.particles.length / settings.particles.duration, 
        time;

    function pointOnHeart(t) { 
        return new Point(
            160 * Math.pow(Math.sin(t), 3),
            130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
        );
    }

    var image = (function() {
        var canvas  = document.createElement('canvas'), 
            context = canvas.getContext('2d');
        canvas.width  = settings.particles.size;
        canvas.height = settings.particles.size;

        function to(t) { 
            var point = pointOnHeart(t);
            point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
            point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
            return point;
        }

        context.beginPath();
        var t = -Math.PI;
        var point = to(t);
        context.moveTo(point.x, point.y);

        while (t < Math.PI) { 
            t += 0.01;
            point = to(t);
            context.lineTo(point.x, point.y);
        }

        context.closePath();
        context.fillStyle = '#ea80b0';
        context.fill();
        var image = new Image();
        image.src = canvas.toDataURL();
        return image;
    })();

    function render() {
        requestAnimationFrame(render);
        var newTime = new Date().getTime() / 1000, 
            deltaTime = newTime - (time || newTime);
        time = newTime;
        context.clearRect(0, 0, canvas.width, canvas.height);
        var amount = particleRate * deltaTime;

        for (var i = 0; i < amount; i++) {
            var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
            var dir = pos.clone().length(settings.particles.velocity);
            particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
        }
        
        particles.update(deltaTime);
        particles.draw(context, image);
    }

    function onResize() {
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    window.onresize = onResize;
    
    setTimeout(function() {
        onResize();
        render();
    }, 10);
})
(document.getElementById('pinkboard'));
// Configuration
const CONFIG = {
    textCount: 15, // Number of "I LOVE YOU" texts to display
    minDelay: 1000, // Minimum delay between text appearances (ms)
    maxDelay: 3000, // Maximum delay between text appearances (ms)
    animationDuration: 4000, // Duration of each text animation (ms)
    heartRadius: 250, // Radius around heart to avoid overlap
    text: "LOVE"
};

class FloatingTextManager {
    constructor() {
        this.container = document.getElementById('floatingTextContainer');
        this.activeTexts = new Set();
        this.heartCenter = this.getHeartCenter();
        this.init();
    }

    init() {
        for (let i = 0; i < CONFIG.textCount; i++) {
            setTimeout(() => {
                this.createFloatingText();
            }, Math.random() * 3000);
        }

        window.addEventListener('resize', () => {
            this.heartCenter = this.getHeartCenter();
        });
    }

    getHeartCenter() {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }

    getRandomPosition() {
        let position;
        let attempts = 0;
        const maxAttempts = 50;

        do {
            position = {
                x: Math.random() * (window.innerWidth - 200),
                y: Math.random() * (window.innerHeight - 100)
            };
            attempts++;
        } while (this.isNearHeart(position) && attempts < maxAttempts);

        return position;
    }

    isNearHeart(position) {
        const distance = Math.sqrt(
            Math.pow(position.x - this.heartCenter.x, 2) +
            Math.pow(position.y - this.heartCenter.y, 2)
        );
        return distance < CONFIG.heartRadius;
    }

    createFloatingText() {
        const textElement = document.createElement('div');
        textElement.className = 'floating-text';
        textElement.textContent = CONFIG.text;

        const position = this.getRandomPosition();
        textElement.style.left = position.x + 'px';
        textElement.style.top = position.y + 'px';

        const delay = Math.random() * 2000;
        textElement.style.animationDelay = delay + 'ms';

        this.container.appendChild(textElement);
        this.activeTexts.add(textElement);

        setTimeout(() => {
            if (textElement.parentNode) {
                textElement.parentNode.removeChild(textElement);
            }
            this.activeTexts.delete(textElement);
            
            setTimeout(() => {
                this.createFloatingText();
            }, Math.random() * (CONFIG.maxDelay - CONFIG.minDelay) + CONFIG.minDelay);
        }, CONFIG.animationDuration + delay);
    }
}

class SparkleEffect {
    constructor() {
        this.sparkles = [];
        this.init();
    }

    init() {
        setInterval(() => {
            this.createSparkle();
        }, 500);
    }

    createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ff69b4;
            border-radius: 50%;
            pointer-events: none;
            animation: sparkleAnim 2s ease-out forwards;
            box-shadow: 0 0 6px #ff69b4;
        `;

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';

        document.body.appendChild(sparkle);

        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 2000);
    }
}

const sparkleCSS = `
    @keyframes sparkleAnim {
        0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
        }
        50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
        }
        100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
        }
    }
`;

const style = document.createElement('style');
style.textContent = sparkleCSS;
document.head.appendChild(style);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FloatingTextManager();
    new SparkleEffect();
});

// Add some interactive effects
document.addEventListener('click', (e) => {
    // Create burst of sparkles on click
    for (let i = 0; i < 5; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: #ff69b4;
            border-radius: 50%;
            pointer-events: none;
            animation: sparkleAnim 1s ease-out forwards;
            box-shadow: 0 0 10px #ff69b4;
        `;

        const angle = (i / 5) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const x = e.clientX + Math.cos(angle) * distance;
        const y = e.clientY + Math.sin(angle) * distance;
        
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';

        document.body.appendChild(sparkle);

        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 1000);
    }
    
});

