import React, { Component } from 'react';

import { View, LayoutAnimation } from 'react-native';

import { HorizontalLine } from '@components/General/HorizontalLine';

import { AppColors, AppSizes } from '@theme';

import { NumberBox } from './NumberBox';

import styles from './styles';

/* Type ==================================================================== */
interface Props {
    currentStep?: number;
    onStepChange: (index: number) => void;
    length: number;
}

interface State {
    currentStep: number;
    maxBoxInScreen: number;
}

/* Component ==================================================================== */
export default class NumberSteps extends Component<Props, State> {
    static defaultProps = {
        currentStep: 0,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            currentStep: props.currentStep,
            maxBoxInScreen: 0,
        };
    }
    componentDidMount() {
        const lineAndBoxWidth = AppSizes.widthPercentageToDP(6) + AppSizes.widthPercentageToDP(10);
        const maxBoxInScreen = Math.floor(AppSizes.screen.width / lineAndBoxWidth);

        this.setState({ maxBoxInScreen });
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if (props.currentStep !== state.currentStep) {
            return {
                currentStep: props.currentStep,
            };
        }

        return null;
    }

    public changeCurrentStep = (index: number) => {
        this.setState({
            currentStep: index,
        });
    };

    onBoxPress = (index: number) => {
        const { onStepChange } = this.props;
        const { currentStep } = this.state;

        if (index > currentStep) {
            return;
        }

        this.setState(
            {
                currentStep: index,
            },
            () => {
                if (typeof onStepChange === 'function') {
                    onStepChange(index);
                }
            },
        );

        LayoutAnimation.easeInEaseOut();
    };

    renderBox = () => {
        const { length } = this.props;
        const { currentStep, maxBoxInScreen } = this.state;

        const items = [];

        let start = currentStep === 0 ? 0 : currentStep - 1;
        const end = maxBoxInScreen + start < length ? maxBoxInScreen + start : length;

        if (end - start < maxBoxInScreen) {
            start = length - maxBoxInScreen;
        }

        for (let i = start; i < end; i++) {
            items.push(
                <NumberBox
                    key={`box-${i}`}
                    index={i}
                    active={currentStep === i}
                    past={currentStep > i}
                    onPress={this.onBoxPress}
                />,
            );

            if (i < length - 1) {
                items.push(
                    <HorizontalLine
                        key={`line-${i}`}
                        color={AppColors.grey}
                        height={4}
                        width={AppSizes.widthPercentageToDP(6)}
                    />,
                );
            }

            if (i === length - 1) {
                items.push(
                    <HorizontalLine
                        key="line-end"
                        color={AppColors.transparent}
                        height={4}
                        width={AppSizes.widthPercentageToDP(6)}
                    />,
                );
            }
        }

        return items;
    };

    render() {
        return <View style={styles.container}>{this.renderBox()}</View>;
    }
}
