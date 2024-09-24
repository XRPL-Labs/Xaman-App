/**
 * ReadMore
 *
    <ReadMore numberOfLines={3}>Long Text</ReadMore>
 *
 */
import React, { Component } from 'react';
import { View, Text, TextStyle, TouchableOpacity } from 'react-native';

import Localize from '@locale';

import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

interface Props {
    children: React.ReactNode;
    numberOfLines: number;
    textStyle: TextStyle | Array<TextStyle>;
}

interface State {
    isFullTextShown: boolean;
    numberOfLines: number;
}

/* Component ==================================================================== */
class ReadMore extends Component<Props, State> {
    private trimmedTextHeight: number;
    private fullTextHeight: number;
    private shouldShowMore: boolean;

    constructor(props: Props) {
        super(props);

        this.state = {
            isFullTextShown: true,
            numberOfLines: props.numberOfLines,
        };

        this.trimmedTextHeight = null;
        this.fullTextHeight = null;
        this.shouldShowMore = false;
    }

    hideFullText = () => {
        const { isFullTextShown } = this.state;

        if (isFullTextShown && this.trimmedTextHeight && this.fullTextHeight) {
            this.shouldShowMore = this.trimmedTextHeight < this.fullTextHeight;
            this.setState({
                isFullTextShown: false,
            });
        }
    };

    onLayoutTrimmedText = (event: any) => {
        const { height } = event.nativeEvent.layout;

        this.trimmedTextHeight = height;
        this.hideFullText();
    };

    onLayoutFullText = (event: any) => {
        const { height } = event.nativeEvent.layout;

        this.fullTextHeight = height;
        this.hideFullText();
    };

    onPressMore = () => {
        this.setState({
            numberOfLines: null,
        });
    };

    onPressLess = () => {
        const { numberOfLines } = this.props;

        this.setState({
            numberOfLines,
        });
    };

    getWrapperStyle = () => {
        const { isFullTextShown } = this.state;

        if (isFullTextShown) {
            return styles.transparent;
        }
        return {};
    };

    renderViewMore = () => {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={[AppStyles.row, AppStyles.paddingTopSml, AppStyles.centerSelf]}
                onPress={this.onPressMore}
            >
                <Text style={styles.viewMoreText}>{Localize.t('global.readMore')}</Text>
                <Icon name="IconChevronDown" style={AppStyles.imgColorGrey} size={21} />
            </TouchableOpacity>
        );
    };

    renderViewLess = () => {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={[AppStyles.row, AppStyles.paddingTopSml, AppStyles.centerSelf]}
                onPress={this.onPressLess}
            >
                <Text style={styles.viewMoreText}>{Localize.t('global.readLess')}</Text>
                <Icon name="IconChevronUp" style={AppStyles.imgColorGrey} size={21} />
            </TouchableOpacity>
        );
    };

    renderFooter = () => {
        const { numberOfLines } = this.state;

        if (this.shouldShowMore === true) {
            if (numberOfLines > 0) {
                return this.renderViewMore();
            }
            return this.renderViewLess();
        }
        return null;
    };

    renderFullText = () => {
        const { isFullTextShown } = this.state;
        const { children, textStyle } = this.props;

        if (isFullTextShown) {
            return (
                <View onLayout={this.onLayoutFullText} style={styles.fullTextWrapper}>
                    <Text selectable style={textStyle}>
                        {children}
                    </Text>
                </View>
            );
        }
        return null;
    };

    render() {
        const { numberOfLines } = this.state;
        const { children, textStyle } = this.props;

        return (
            <View style={this.getWrapperStyle()}>
                <View onLayout={this.onLayoutTrimmedText}>
                    <Text style={textStyle} numberOfLines={numberOfLines}>
                        {children}
                    </Text>
                    {this.renderFooter()}
                </View>

                {this.renderFullText()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ReadMore;
