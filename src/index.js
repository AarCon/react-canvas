import React from 'react';
import PropTypes from 'prop-types';

export const EventTypes = {
	MOVE: 'mousemove',
	MOUSE_DOWN: 'mousedown',
	MOUSE_UP: 'mouseup',
	KEY_DOWN: 'keydown',
	KEY_UP: 'keyup',
	WHEEL: 'wheel',
};

export const ButtonTypes = {
	LEFT: 'left',
	MIDDLE: 'middle',
	RIGHT: 'right'
}

// 0=left, 1=middle, 2=right
const ButtonMap = [
	ButtonTypes.LEFT,
	ButtonTypes.MIDDLE,
	ButtonTypes.RIGHT
];

function drawShape(x, y, context, points, color, fill, close) {
	context.save();
	context.fillStyle = color;
	context.strokeStyle = color;
	context.beginPath();
	context.moveTo(points[0].x + x,points[0].y + y);
	for (var i=1;i<points.length;i++) {
		context.lineTo(points[i].x + x,points[i].y + y);
	}
	if (close) {
		context.closePath();
	}
	if (fill) context.fill();
	context.stroke();
	context.restore();
}

const okCodes = [
	'Space',
	'Backslash',
	'BracketLeft',
	'BracketRight',
	'Quote',
	'Semicolon',
	'Period',
	'Comma',
	'Slash',
	'Backquote',
	'Minus',
	'Equal'
];

function getChar({ key, code }) {
	if (code.indexOf('Key') === 0
		|| code.indexOf('Digit') === 0
		|| code.indexOf('Numpad') === 0
	) {
		// some though we don't want
		if (code !== 'NumpadEnter') {
			return key;
		}
	}
	
	if (okCodes.includes(code)) {
		return key;
	}
	// if not key and not [in map, then no char for it
}

function getCode({ code }) {
	return code;
}
const handlerToProps = {
	[EventTypes.MOVE]: 'onMove',
	[EventTypes.MOUSE_DOWN]: 'onMouseDown',
	[EventTypes.MOUSE_UP]: 'onMouseUp',
	[EventTypes.KEY_DOWN]: 'onKeyDown',
	[EventTypes.KEY_UP]: 'onKeyUp',
	[EventTypes.WHEEL]: 'onWheel',
};

const CanvasContext = React.createContext({
	context: null,
	registerListener: null,
	unregisterListener: null,
	triggerRender: null,
});

const canvasProps = {
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	captureAllKeyEvents: PropTypes.bool
}

const canvasDefaultProps = {
	captureAllKeyEvents: true
}

const doRender = (element,  context) => {
	let children = [];
	if (element.type.length === 1) {
		children = element.type(element.props);
	} else if (element.type._context) {
		// in this case the only child is the function to call with context
		children = element.props.children(context);
	} else {
		// we've got a class component
		// this is kinda awful for a variety of reasons
		// and I imagine will cause a lot of bugs.
		const inst = new element.type(element.props);
		children = inst.render();
	}
	
	if (!Array.isArray(children)) {
		children = [children];
	}
	
	children.forEach((child) => {
		if (!child) {
			return;
		}
		doRender(child, context);
	});
}

class Canvas extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			context: null
		};
		
		this.indexList = [];
		
		this.reattachListeners = this.reattachListeners.bind(this);
		this.removeListeners = this.removeListeners.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.handleContextMenu = this.handleContextMenu.bind(this);
		this.handleWheel = this.handleWheel.bind(this);
		this.registerListener = this.registerListener.bind(this);
		this.unregisterListener = this.unregisterListener.bind(this);
		this.forceRerender = this.forceRerender.bind(this);
		this.triggerRender = this.triggerRender.bind(this);
		
		// map of event to array of function callbacks
		this.listeners = {};
	}
	registerListener(event, fn) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(fn);
	}
	unregisterListener(event, fn) {
		if (!this.listeners[event]) {
			return;
		}
		
		const index = this.listeners[event].indexOf(fn);
		
		if (index < 0) return;
		this.listeners[event].splice(index, 1);
	}
	forceRerender() {
		this.forceUpdate();
	}
	getMyContext() {
	    return {
			context: this.state.context,
			registerListener: this.registerListener,
			unregisterListener: this.unregisterListener,
			forceRerender: this.forceRerender,
			triggerRender: this.triggerRender,
		};
	}
	componentWillUpdate(newProps) {
		if (newProps.width !== this.canvas.width) {
			this.canvas.width = newProps.width;
		}
		if (newProps.height !== this.canvas.height) {
			this.canvas.height = newProps.height;
		}
	}
	componentDidMount() {
		if (this.props.width !== this.canvas.width) {
			this.canvas.width = this.props.width;
		}
		if (this.props.height !== this.canvas.height) {
			this.canvas.height = this.props.height;
		}
	}
	componentWillUnmount() {
		this.removeListeners();
	}
	removeListeners() {
		this.canvas.removeEventListener('touchmove', this.handleMouseMove);
		this.canvas.removeEventListener('touchstart', this.handleMouseDown);
		this.canvas.removeEventListener('touchend', this.handleMouseUp);
		this.canvas.removeEventListener('mousemove', this.handleMouseMove);
		this.canvas.removeEventListener('mousedown', this.handleMouseDown);
		this.canvas.removeEventListener('mouseup', this.handleMouseUp);
		this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
		this.canvas.removeEventListener('wheel', this.handleWheel);
	}
	reattachListeners() {
		// remove previous event handlers. this is so we avoid
		// double and triple triggering events
		this.removeListeners();

		this.canvas.addEventListener('touchmove', this.handleMouseMove);
		this.canvas.addEventListener('touchstart', this.handleMouseDown);
		this.canvas.addEventListener('touchend', this.handleMouseUp);
		this.canvas.addEventListener('mousemove', this.handleMouseMove);
		this.canvas.addEventListener('mousedown', this.handleMouseDown);
		this.canvas.addEventListener('mouseup', this.handleMouseUp);
		this.canvas.addEventListener('contextmenu', this.handleContextMenu);
		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
		this.canvas.addEventListener('wheel', this.handleWheel);
	}
	getRealCoords(event) {
	    const rect = this.canvas.getBoundingClientRect();
		
		// if this is a touch event, handle it specially
		if (event.touches) {
			const handledTouches = [];
			for (const touch of event.touches) {
				handledTouches.push({
					x: touch.clientX - rect.left,
					y: touch.clientY - rect.top,
				});
			}
			
			if (handledTouches.length === 0) {
				// touchend only has changedTouches
				for (const touch of event.changedTouches) {
					handledTouches.push({
						x: touch.clientX - rect.left,
						y: touch.clientY - rect.top,
					});
				}
			}
			
			if (handledTouches.length === 0) {
				// shouldn't happen but just in case
				return {};
			}
			
			return {
				x: handledTouches[0].x,
				y: handledTouches[0].y,
				touches: handledTouches,
			}
		}
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}
	handleMouseMove(event) {
		this.triggerEvent(EventTypes.MOVE, this.getRealCoords(event));
		event.preventDefault();
	}
	handleMouseDown(event) {
		this.triggerEvent(EventTypes.MOUSE_DOWN, {
			...this.getRealCoords(event),
			button: ButtonMap[event.button]
		});
		event.preventDefault();
	}
	handleMouseUp(event) {
		this.triggerEvent(EventTypes.MOUSE_UP, {
			...this.getRealCoords(event),
			button: ButtonMap[event.button]
		});
		event.preventDefault();
	}
	handleKeyDown(event) {
		const bodyEvent = event.target.tagName === 'BODY';
		if (!bodyEvent && !this.props.captureAllKeyEvents) {
			// if this event did not come from the body, check if
			// we want to capture all events. If we do, capture it
			// if not, ignore it
			return;
		}
		this.triggerEvent(EventTypes.KEY_DOWN, {
			char: getChar(event),
			code: getCode(event)
		});
		event.preventDefault();
	}
	handleKeyUp(event) {
		const bodyEvent = event.target.tagName === 'BODY';
		if (!bodyEvent && !this.props.captureAllKeyEvents) {
			// if this event did not come from the body, check if
			// we want to capture all events. If we do, capture it
			// if not, ignore it
			return;
		}
		this.triggerEvent(EventTypes.KEY_UP, {
			char: getChar(event),
			code: getCode(event)
		});
		event.preventDefault();
	}
	handleContextMenu(event) {
		event.preventDefault();
	}
	handleWheel(event) {
		this.triggerEvent(EventTypes.WHEEL, {
			...this.getRealCoords(event),
			up: event.wheelDelta > 0,
		});
	}
	triggerEvent(event, data) {
		if (this.listeners[event]) {
			this.listeners[event].forEach((fn) => {
				fn(data);
			});
		}
		
		if (handlerToProps[event]) {
			const propName = handlerToProps[event];
			const propFn = this.props[propName];
			if (propFn) {
				propFn(data);
			}
		}
	}
	triggerRender(component) {
		if (!component || !component.props || component.props.zIndex === undefined) {
			return;
		}
		const zIndex = component.props.zIndex;
		
		for (let i=zIndex+1;i<this.indexList.length;i++) {
			const list = this.indexList[i];
			if (!list) {
				// this can happen if we have a gap in the zindex
				continue;
			}
			list.forEach((element) => {
				doRender(element, this.getMyContext());
			});
		}
	}
	render() {
		this.indexList = [];
		const newChildren = this.props.children.map((child) => {
			const props = child.props;
			const workingIndex = props.zIndex === undefined ? 1 : props.zIndex;
			const newProps = {
				...props,
				zIndex: workingIndex,
			};
			if (!this.indexList[workingIndex]) {
				this.indexList[workingIndex] = [];
			}
			this.indexList[workingIndex].push(child);
			return React.cloneElement(child, newProps);
		});
		return <CanvasContext.Provider value={this.getMyContext()}>		
			<canvas
				ref={(c) => {
					if (c) {
						const newContext = c.getContext('2d');
						if (this.state.context !== newContext) {
							this.canvas = c;
							this.setState({
								context: newContext
							}, () => {
								this.reattachListeners();
							});
						}
					}
				}}
			>
				{newChildren}
			</canvas>
		</CanvasContext.Provider>;
	}
};

Canvas.propTypes = canvasProps;
Canvas.defaultProps = canvasDefaultProps;

const Container = ({ children }) => {
	if (Array.isArray(children)) {
		return [...children];
	} else {
		return children;
	}
}

const Text = ({ children, x, y, color, font }) => {
	return <CanvasContext.Consumer>
		{({ context }) => {
			if (!context) {
				return null;
			}
			if (!color) {
				color = "#000";
			}
			if (!font) {
				font = "12px Arial";
			}
			context.save();
			context.font = font;
			context.fillStyle = color;
			if (!Array.isArray(children)) {
				children = [children];
			}
			context.fillText(children.join(''), x, y);
			context.restore();
		}}
	</CanvasContext.Consumer>;
}

const Line = ({ x, y, x2, y2, color }) => {
	return <CanvasContext.Consumer>
		{({ context }) => {
			if (!context) {
				return null;
			}
			context.save();
			context.strokeStyle = color;
			context.beginPath();
			context.moveTo(x, y);
			context.lineTo(x2, y2);
			context.closePath();
			context.stroke();
			context.restore();
		}}
	</CanvasContext.Consumer>;
}

const Shape = ({ x, y, points, color, fill, close }) => {
	if (close === undefined) {
		close = true;
	}
	return <CanvasContext.Consumer>
		{({ context }) => {
			if (!context) {
				return null;
			}

			drawShape(x, y, context, points, color, fill, close);
		}}
	</CanvasContext.Consumer>;
}

const Rect = ({ x, y, x2, y2, color, fill}) => {
	const width = Math.abs(x2 - x);
	const height = Math.abs(y2 - y);
	return <Shape
		x={x}
		y={y}
		points={[
			{ x: 0, y: 0 },
			{ x: 0, y: height },
			{ x: width, y: height},
			{ x: width, y: 0 }
		]}
		color={color}
		fill={fill}
	/>;
}

const loadingMap = {};
const imageMap = {};

class Image extends React.Component {
	static contextType = CanvasContext;

	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			imageHandle: null
		};
	}
	
	render() {
		const { src, x, y, width, height } = this.props;
		const { context, forceRerender } = this.context;
		
		if (!context) {
			return null;
		}
		
		let img;

		const finishLoading = () => {
			const image = imageMap[src];
			context.drawImage(image, x,y, width, height);
		}
		
		// if we're already loading this image, give up for now. Once it's
		// loading, we will get a redraw of the canvas.
		if (loadingMap[src]) {
			return null;
		}
		
		if (imageMap[src]) {
			finishLoading(imageMap[src]);
		} else {
			const body = document.getElementsByTagName("body")[0];
		
			const img = document.createElement("img");
			img.src = src;
			img.onload = () => {
				imageMap[src] = img;
				delete loadingMap[src];
				forceRerender();
			};
			if (img.loaded) {
				imageMap[src] = img;
				finishLoading();
			} else {
				loadingMap[src] = img;
			}
			img.style.display = 'none';
			body.append(img);
		}
		
		return null;
	}
};

const Arc = ({ x, y, radius, startAngle, endAngle, color, fill, sector, closed }) => {
	return <CanvasContext.Consumer>
		{({ context }) => {
			if (!context) {
				return null;
			}

			context.save();
			context.strokeStyle = color;
			context.fillStyle = color;
			context.beginPath();
			if (sector) {
				context.moveTo(x, y);
			}
			context.arc(x, y, radius, startAngle, endAngle);
			if (sector) {
				context.moveTo(x, y);
			}
			if (closed) {
				context.closePath();
			}
			if (!fill) {
				context.stroke();
			} else {
				context.fill();
			}
			context.restore();
		}}
	</CanvasContext.Consumer>;
}

const Circle = ({ x, y, radius, color, fill }) => {
	return <Arc
		x={x}
		y={y}
		radius={radius}
		startAngle={0}
		endAngle={2 * Math.PI}
		color={color}
		fill={fill}
	/>;
}

const Raw = ({ drawFn }) => {
	return <CanvasContext.Consumer>
		{({ context }) => {
			if (!context) {
				return null;
			}

			context.save();
			drawFn(context);
			context.restore();
		}}
	</CanvasContext.Consumer>;
}

class CanvasComponent extends React.Component {
	static contextType = CanvasContext;

	constructor(props) {
		super(props);
		
		this.bounds = null;
		
		this.handleMove = this.handleMove.bind(this);
		this.handleUp = this.handleUp.bind(this);
		this.handleDown = this.handleDown.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.handleWheel = this.handleWheel.bind(this);
	}
	componentDidMount() {
		if (!this.context.registerListener) {
			console.error('Unable to get child context for CanvasComponent-likely it is not nested inside a Canvas');
			return;
		}
		this.context.registerListener(EventTypes.MOVE, this.handleMove);
		this.context.registerListener(EventTypes.MOUSE_UP, this.handleUp);
		this.context.registerListener(EventTypes.MOUSE_DOWN, this.handleDown);
		this.context.registerListener(EventTypes.KEY_DOWN, this.onKeyDown);
		this.context.registerListener(EventTypes.KEY_DOWN, this.onKeyUp);
		this.context.registerListener(EventTypes.WHEEL, this.handleWheel);
	}
	insideMe(x, y) {
		if (!this.bounds) {
			return false;
		}
		return x > this.bounds.x && x < this.bounds.x + this.bounds.width && y > this.bounds.y && y < this.bounds.y + this.bounds.height
	}
	handleMove(data) {
		let insideMe = this.insideMe(data.x, data.y);
		
		this.onMouseMove(data, insideMe);
	}
	handleUp(data) {
		let insideMe = this.insideMe(data.x, data.y);
		
		this.onMouseUp(data, insideMe);
	}
	handleDown(data) {
		let insideMe = this.insideMe(data.x, data.y);
		
		this.onMouseDown(data, insideMe);
	}
	handleWheel(data) {
		let insideMe = this.insideMe(data.x, data.y);
		
		this.onWheel(data, insideMe);
	}
	componentWillUnmount() {
		if (!this.context.unregisterListener) {
			console.error('Unable to get child context for CanvasComponent-likely it is not nested inside a Canvas');
			return;
		}
		this.context.unregisterListener(EventTypes.MOVE, this.handleMove);
		this.context.unregisterListener(EventTypes.MOUSE_UP, this.handleUp);
		this.context.unregisterListener(EventTypes.MOUSE_DOWN, this.handleDown);
		this.context.unregisterListener(EventTypes.KEY_DOWN, this.onKeyDown);
		this.context.unregisterListener(EventTypes.KEY_DOWN, this.onKeyUp);
		this.context.unregisterListener(EventTypes.WHEEL, this.handleWheel);
	}
	
	// stubs
	onMouseMove() {}
	onMouseUp() {}
	onMouseDown() {}
	onKeyDown() {}
	onKeyUp() {}
	onWheel() {}
	
	render() {
		if (this.context.triggerRender) {
			setTimeout(() => {
				this.context.triggerRender(this);
			},0);
		}
	}
}

CanvasComponent.contextType = CanvasContext;

export {
	Canvas,
	Container,
	Text,
	Shape,
	Image,
	CanvasComponent,
	Line,
	Rect,
	Circle,
	Arc,
	Raw,
	CanvasContext,
};