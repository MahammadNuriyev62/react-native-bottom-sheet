import React, { useState, useRef, useEffect } from 'react';
import { Animated, Easing, TouchableWithoutFeedback, View, Dimensions } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView, } from 'react-native-gesture-handler';

const Status = Object.freeze({
    HIDDEN: 1,
    CLOSED: 2,
    OPENED: 3,
})

const VEL_LIMIT = 100
const DELTA_TRUE = 100
const DELTA_FALSE = 100
const BACK_LAYER_ERROR = 10


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheet = ({ children, onStatusChange, boundaries, style, isVisible, setIsVisible, contentAnimatedOpacity, CustomGrip,
    deltaTrue = DELTA_TRUE, deltaFalse = DELTA_FALSE
}) => {

    const height = style?.height || SCREEN_HEIGHT - deltaTrue

    const TRANSLATE_Y_CLOSED = height - deltaFalse + deltaTrue
    const TRANSLATE_Y_OPENED = deltaTrue
    const TRANSLATE_Y_HIDDEN = height + deltaTrue

    boundaries = boundaries || { [Status.OPENED]: TRANSLATE_Y_OPENED, [Status.CLOSED]: TRANSLATE_Y_CLOSED, [Status.HIDDEN]: TRANSLATE_Y_HIDDEN }

    const [status, setStatus] = React.useState(Status.HIDDEN);
    const [isBackLayerVisible, setIsBackLayerVisible] = React.useState(false);

    const translateY = useRef(new Animated.Value(boundaries[status])).current;

    const [prevTranslationY, setPrevTranslationY] = useState(boundaries[status]);

    const [listenerID, setListenerID] = React.useState(null);

    const move = React.useCallback((y) => {
        Animated.spring(translateY, {
            toValue: y,
            useNativeDriver: true,
        }).start()
        setPrevTranslationY(y)
    }, [])

    const handlePanStateChange = React.useCallback(({ nativeEvent }) => {
        if (nativeEvent.state === State.END) {
            let { velocityY } = nativeEvent;
            let _status = status
            if (Math.abs(velocityY) > VEL_LIMIT) {
                if (_status === Status.CLOSED && velocityY < 0) {
                    _status = (Status.OPENED)
                } else if (status === Status.OPENED && velocityY > 0) {
                    _status = (Status.CLOSED)
                }
                setStatus(_status)
            }
            move(boundaries[_status])
        }
    }, [status])

    useEffect(() => {
        onStatusChange?.({ status })
    }, [status]);

    React.useEffect(() => {
        let status;
        if (isVisible) {
            status = (Status.CLOSED)
        } else {
            status = (Status.HIDDEN)
        }
        setStatus(status)
        move(boundaries[status])
    }, [isVisible]);

    const opacityOfLayer = translateY.interpolate({
        inputRange: [TRANSLATE_Y_CLOSED, TRANSLATE_Y_HIDDEN],
        outputRange: [0.3, 0],
        extrapolate: 'clamp',
    })

    const opacityOfContent = translateY.interpolate({
        inputRange: [TRANSLATE_Y_OPENED, TRANSLATE_Y_CLOSED],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    })

    React.useEffect(() => {
        setListenerID(translateY.addListener(({ value }) => {
            if (TRANSLATE_Y_HIDDEN - BACK_LAYER_ERROR < value && value < TRANSLATE_Y_HIDDEN + BACK_LAYER_ERROR) {
                setIsBackLayerVisible(false)
            } else {
                setIsBackLayerVisible(true)
            }
        }))
        return () => { translateY.removeListener(listenerID) }
    }, []);

    return <>
        {isBackLayerVisible && <TouchableWithoutFeedback style={{
        }} onPress={() => { setIsVisible(false); }}>
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    backgroundColor: 'black',
                    opacity: opacityOfLayer,
                    height: SCREEN_HEIGHT,
                    width: '100%',
                    zIndex: 10000,
                }}
            />
        </TouchableWithoutFeedback>}
        <Animated.View
            style={{
                transform: [{ translateY }],
                position: 'absolute',
                width: '100%',
                zIndex: 20000,
            }}
        >
            <GestureHandlerRootView>
                <PanGestureHandler
                    onGestureEvent={(e) => {
                        const { translationY } = e.nativeEvent;
                        translationY && Animated.timing(translateY, {
                            duration: 0,
                            easing: Easing.linear,
                            toValue: prevTranslationY + translationY,
                            useNativeDriver: true,
                        }).start()
                    }}
                    onHandlerStateChange={handlePanStateChange}
                >
                    <View
                        style={{
                            height: height,
                            borderTopLeftRadius: 30,
                            borderTopRightRadius: 30,
                            overflow: 'hidden',
                        }}
                    >
                        {CustomGrip || <View
                            style={{
                                borderTopLeftRadius: 30,
                                borderTopRightRadius: 30,
                                backgroundColor: 'white'
                            }}
                        >

                            <View style={{
                                height: 4,
                                width: 42,
                                backgroundColor: '#A2A2A2',
                                marginTop: 13,
                                borderRadius: 100,
                                alignSelf: 'center'
                            }} />
                        </View>
                        }
                        <View
                            style={{ backgroundColor: 'white', flex: 1 }}
                        >

                            <Animated.View
                                style={contentAnimatedOpacity && {
                                    opacity: opacityOfContent
                                }}
                            >
                                {children}
                            </Animated.View>
                        </View>
                    </View>
                </PanGestureHandler>
            </GestureHandlerRootView>
        </Animated.View>
    </>
}

BottomSheet.Status = Status

export default BottomSheet;