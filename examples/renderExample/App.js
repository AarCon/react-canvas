import React from 'react';
import {
	Canvas,
    Line,
    renderToImage,
} from 'react-canvas';

import styles from '../styles.css';
import { Rect } from '../../src';

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            image: null,
            x: [10, 10, 10, 10, 10, 10, 10]
        };
    }
    componentDidMount() {
        this.interval = setInterval(() => {
            const newX = this.state.x.map((x) => {
                let newX = x + getRandomInt(1, 20);
                if (newX > 200) {
                    newX = 0;
                }

                return newX;
            });

            this.setState({
                x: newX,
            });
        }, 200);
    }
    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    render() {
        const width = 300;
        const height = 100;

        const components = <>
            <Rect
                x={0}
                y={0}
                x2={width}
                y2={height}
                color="#fff"
                fill={true}
            />
            { this.state.x.map((x, index) => {
                return <Line
                    key={index}
                    x={x}
                    y={10*index+10}
                    x2={x+100}
                    y2={10*index+10}
                    color="#888"
                />
            })}
        </>;

        return (<div className={styles.appRoot}>
            Canvas:<br/>
            <Canvas
                width={width}
                height={height}
                customRender={true}
                doubleBuffer={true}
            >
                { components }
            </Canvas>
            <br/>
            <input type="button" value="Capture Image" onClick={() => {
                const newImage = renderToImage(components, width, height);

                this.setState({
                    image: newImage
                });
            }}/><br/>
            Image:<br/>
            <img src={this.state.image}/>
        </div>);
    }
};

export default App;