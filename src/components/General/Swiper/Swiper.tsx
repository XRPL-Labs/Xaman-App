import React, { Component } from 'react';
import { ScrollView, View } from 'react-native';

import { AppSizes } from '@theme';
/* Types ==================================================================== */
interface Props {
    items: any;
    renderItem: (item: any) => React.ReactElement | null;
    onChange?: (item: any) => void;
}

interface State {}

/* Component ==================================================================== */
class Swiper extends Component<Props, State> {
    scroll: ScrollView = undefined;
    views: Map<number, View> = new Map();

    private measureViewTimeout: any;

    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        setTimeout(() => {
            if (this.scroll) {
                this.scroll.scrollTo({ x: -30 });
            }
        }, 10);
    }

    componentWillUnmount() {
        if (this.measureViewTimeout) clearTimeout(this.measureViewTimeout);
    }

    onItemChange(item: any) {
        const { onChange } = this.props;

        if (onChange) {
            onChange(item);
        }
    }

    onScrollEnd = () => {
        const { items } = this.props;
        this.measureViewTimeout = setTimeout(() => {
            for (const [index, view] of this.views.entries()) {
                view.measure((x, y, width, height, pageX) => {
                    if (pageX > 20 && pageX < 40) {
                        this.onItemChange(items[index]);
                    }
                });
            }
        }, 500);
    };

    render() {
        const { items, renderItem } = this.props;

        return (
            <ScrollView
                ref={(r) => {
                    this.scroll = r;
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate={0}
                snapToInterval={AppSizes.screen.width - 60}
                snapToAlignment="center"
                onScrollEndDrag={this.onScrollEnd}
                contentInset={{
                    top: 0,
                    left: 30,
                    bottom: 0,
                    right: 30,
                }}
            >
                {items.map((item: any, index: number) => {
                    return (
                        <View
                            ref={(r) => {
                                this.views.set(index, r);
                            }}
                            key={index}
                        >
                            {renderItem(item)}
                        </View>
                    );
                })}
            </ScrollView>
        );
    }
}

export default Swiper;
